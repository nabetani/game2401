import * as Phaser from 'phaser';
import { BaseScene } from './baseScene';
import qlist from './q.json'
import { WStorage } from './wstorage';

interface QLine {
  t: string[]
}
interface QRef {
  url: string | undefined
  t: string
}
interface QInfo {
  ref: QRef
  body: QLine[]
}

const GRWon = {
  c: 0x33ff33,
  text: (t: string | undefined): string => {
    return t ? `勝利!\n${t}秒` : "勝利";
  },
  resText: (t: string | undefined): string => {
    return t ? `勝利! / ${t}秒` : "勝利";
  },
  sound: "found",
  fontSize: 80,
  borderCol: 0x00ff44,
};
const GRFailed = {
  c: 0xff0000,
  text: (t: string | undefined): string => {
    return t ? "敗北!" : "敗北";
  },
  resText: (t: string | undefined): string => {
    return t ? "敗北!" : "敗北";
  },
  sound: "fail",
  fontSize: 80,
  borderCol: 0xaa0000,
};
const GRGiveUp = {
  c: 0xff0000,
  text: (t: string | undefined): string => {
    return "";
  },
  resText: (t: string | undefined): string => {
    return "記録なし";
  },
  sound: "giveup",
  fontSize: 40,
  borderCol: 0xaa00ff,
};

interface GameResultType {
  c: integer
  text: (t: string | undefined) => string;
  resText: (t: string | undefined) => string;
  sound: string,
  borderCol: integer;
  fontSize: number,
};

const depth = {
  "bg": 0,
  "text": 10,
  "emp": 11,
  "resultBase": 100,
  "result": 101,
};

class Line {
  tick: number
  timer: Phaser.GameObjects.Text | null
  text: Phaser.GameObjects.Text
  constructor(tick: number, timer: Phaser.GameObjects.Text | null, text: Phaser.GameObjects.Text) {
    this.tick = tick
    this.timer = timer
    this.text = text
  }
}

type Phase = TryingPhase | PraisePhase | FailedPhase | GiveUpPhase;

class BasePhase {
  scene: GameMain
  constructor(scene: GameMain) {
    this.scene = scene
  }
}

const hasher = (s: integer): integer => {
  const mask = (1 << 30) - 1;
  const rot = (a: number, b: number): number => {
    return ((a << b) | (a >>> (32 - b))) & mask;
  };
  for (let x = 0; x < 3; ++x) {
    s &= mask;
    s = mask & (rot(s ^ 1063544335, 7) * 255571 + rot(s ^ 937800482, 13) * 133801) + 74053032;
  }
  return s / (1 + mask);
}

const randnum = (t: number, i: integer, lo: number, hi: number): number => {
  const a = (hasher(i ^ 1234) + 8) * 2;
  const b = hasher(i) * (2 * Math.PI);
  return (lo + hi) / 2 + (hi - lo) / 2 * Math.sin(t * a + b);
}

const sincos_r = (t: number, r: number = 1, delta: { x: number, y: number } = { x: 0, y: 0 }): [number, number] => {
  const s = Math.sin(t);
  const c = Math.cos(t);
  return [r * s + delta.y, r * c + delta.x];
}

class TryingPhase extends BasePhase {
  t0: number | null = null;
  prevLine: integer = -1;
  constructor(scene: GameMain) {
    super(scene);
  }
  update() {
    if (this.t0 == null) {
      this.t0 = new Date().getTime() + 1000;
    }
    ++this.scene.tick;
    const curLine = Math.floor((new Date().getTime() - this.t0) / 2000);
    if (0 <= curLine && this.prevLine != curLine) {
      this.prevLine = curLine;
      this.scene.showLine(curLine, true, true);
    }
    this.scene.updateTimers()
  }
}

class GameEndPhase extends BasePhase {
  tick: number = 0;
  constructor(scene: GameMain) {
    super(scene)
  }
  update() {
    ++this.tick;
    this.scene.emphasize(this.tick / this.scene.fps());
  }
}

class PraisePhase extends GameEndPhase {
  constructor(scene: GameMain) {
    super(scene)
    scene.onGameEnd(GRWon)
  }
}
class FailedPhase extends GameEndPhase {
  constructor(scene: GameMain) {
    super(scene)
    scene.onGameEnd(GRFailed)
  }
}

class GiveUpPhase extends GameEndPhase {
  constructor(scene: GameMain) {
    super(scene)
    scene.onGameEnd(GRGiveUp)
  }
}

export class GameMain extends BaseScene {
  q: QInfo | null = null;
  qix: integer = -1;
  tick: number = -1
  qkind: string = ""
  textSize: number = 0
  phase: Phase
  ansBBox: Phaser.Geom.Rectangle | null = null;
  caption: Phaser.GameObjects.Text | null = null;
  giveUp: Phaser.GameObjects.Text | null = null;
  graphics: Phaser.GameObjects.Graphics | null = null;
  resBase: Phaser.GameObjects.Graphics | null = null;
  practice: boolean = true;
  soundOn: boolean = false;
  ansCol: integer = 0;
  lines: Line[] = []

  get timerRight(): number {
    const w = this.sys.game.canvas.width
    return w / 7;
  }
  get timerLeft(): number {
    return 10
  }
  get timerW(): number {
    return this.practice ? 0 : this.timerRight - this.timerLeft;
  }
  get timerC(): number {
    return this.timerLeft + this.timerW / 2
  }
  get textLeft(): number {
    return this.timerRight + 10
  }
  get textRight(): number {
    const w = this.sys.game.canvas.width
    return w - 10
  }
  get textW(): number {
    return this.textRight - this.textLeft
  }
  get textWI(): number {
    return this.textW - 16
  }
  get textC(): number {
    return this.textLeft + this.textW / 2
  }
  get captionBounding(): Phaser.Geom.Rectangle {
    return new Phaser.Geom.Rectangle(
      this.textLeft, 10,
      this.textW, 90);
  }
  get linesBounding(): Phaser.Geom.Rectangle {
    const h = this.sys.game.canvas.height
    const top = this.captionBounding.bottom
    return new Phaser.Geom.Rectangle(
      this.textLeft, top,
      this.textW, h - top - 10)
  }
  constructor() {
    super("GameMain");
    this.phase = new TryingPhase(this)
  }
  calcTextSize(lines: QLine[] | QRef[], w: number, h: number): number {
    const s = {
      fontFamily: 'sans-serif',
      padding: { x: 0, y: 0 },
      fontSize: "10px",
    };
    let size = 100;
    const maxH = h / lines.length * 0.7;
    for (const line of lines) {
      const str = typeof (line.t) === "string" ? line.t : line.t.join("");
      const t = this.add.text(0, -1000, str, s);
      const aw = t.getBounds().width;
      const ah = t.getBounds().height;
      size = Math.min(size, 10 * w / aw, 10 * maxH / ah);
      t.destroy(true)
    }
    return size;
  }
  setCaptionLink() {
    if (!this.caption) { return }
    this.caption.on("pointerdown", () => {
      const url = this.q?.ref.url;
      if (url) {
        this.setLocation(url)
      }
    }).setInteractive()
  }

  resY(): number {
    const h = this.sys.game.canvas.height;
    return (this.ansBBox!.centerY < h / 2 ? 0.75 : 0.25) * h;
  }

  showResPanel(gr: GameResultType, bb: Phaser.Geom.Rectangle | null, resTick: string | undefined) {
    const msg = gr.text(resTick);
    if (msg.length == 0) {
      return
    }
    const ty = this.resY();
    const textObj = this.add_text(this.sys.game.canvas.width / 2, ty, {
      fontSize: `${gr.fontSize}px`,
      align: "center",
      backgroundColor: "#0000",
    }, msg, {});
    textObj.setDepth(depth.result);
    const base = this.resBase!
    const resBB = textObj.getBounds();
    const g = 20;
    const params: [number, number, number, number, number] =
      [resBB.x - g, resBB.y - g, resBB.width + g * 2, resBB.height + g * 2, 30];
    base.fillStyle(0xffffff);
    base.fillRoundedRect(...params);
    base.lineStyle(20, gr.borderCol, 1.0);
    base.strokeRoundedRect(...params);
    base.setDepth(depth.resultBase);
  }

  showShareButton(text: string) {
    const ty = this.resY();
    const { width, height } = this.sys.game.canvas;
    const share = this.add.sprite(width * 0.9, ty + 150, "share");
    share.setOrigin(1, 0)
    share.setScale(0.5);
    share.setDepth(depth.resultBase);
    share.on('pointerdown', () => {
      const encoded = encodeURIComponent(text);
      const url = "https://taittsuu.com/share?text=" + encoded;
      if (!window.open(url)) {
        location.href = url;
      }
    }).setInteractive();
  }
  onGameEnd(gr: GameResultType) {
    this.sound.stopAll();
    this.sound.get(gr.sound).play();
    this.ansCol = gr.c;
    this.setCaptionLink();
    this.showGoToTitle();
    if (this.giveUp != null) {
      this.giveUp.destroy();
    }
    this.showAllLines();
    const [bb, resTick] = this.getAnsBBox();
    WStorage.setResult(this.qix, gr.resText(resTick));
    this.ansBBox = bb;
    this.showResPanel(gr, bb, resTick);
    const qinfo = `${this.q!.ref.t.split("\n")[0]}`
    const shareText = [
      `記録: ${gr.resText(resTick)}`,
      `#タイツを探せ - ${this.qkind} (${qinfo})`,
      "https://nabetani.sakura.ne.jp/game24b/",
    ].join("\n");
    this.showShareButton(shareText);
    for (const line of this.lines) {
      line.text.removeAllListeners();
    }
  }

  getAnsBBoxAtLine(q: QLine, text: Phaser.GameObjects.Text): Phaser.Geom.Rectangle {
    const b = text.getBounds();
    let x = b.left
    let bb = new Phaser.Geom.Rectangle();
    q.t.every((t, ix) => {
      const padding = (ix == 0
        ? { left: 3, y: 3, right: 0 }
        : { x: 0, y: 3 })
      const s = { ...this.lineStyle, fixedWidth: 0, padding: padding };
      const p = this.add_text(x, b.centerY, s, t, {});
      p.setOrigin(0, 0.5);
      if (ix == 1) {
        bb = p.getBounds();
        p.destroy();
        return false; // break
      }
      x = p.getBounds().right;
      p.destroy();
      return true; // continue
    });
    return bb;
  }

  emphasize(t: number) {
    const bbox = this.ansBBox!;
    const g = this.graphics!;
    g.clear();
    const c = new Phaser.Geom.Point(bbox.centerX, bbox.centerY);
    const d0 = bbox.width / 3 + 400 * Math.max(0, 1 - t * 2);
    const N = 40;
    const h = this.sys.game.canvas.height;
    g.fillStyle(this.ansCol, 0.5);
    // g.fillRect(bbox.left, bbox.top, bbox.width, bbox.height);
    for (let i = 0; i < N; ++i) {
      const th = (i + randnum(t, i + N * 2, 0, 0.7) + t * 4) * Math.PI * 2 / N;
      const d = randnum(t, i, 0.5, 2) * d0
      const dt = Math.PI * 2 / N * randnum(t, i + N, 0.05, 0.2);
      const [y0, x0] = sincos_r(th, d, c);
      const [y1, x1] = sincos_r(th + dt, h, c);
      const [y2, x2] = sincos_r(th - dt, h, c);
      g.fillTriangle(x0, y0, x1, y1, x2, y2);
    }
  }

  getAnsBBox(): [Phaser.Geom.Rectangle | null, string?] {
    for (let ix = 0; ix < this.q!.body.length; ++ix) {
      const q = this.q!.body[ix]!;
      if (q.t.length < 2) { continue }
      const line = this.lines[ix];
      const text = line.text;
      return [this.getAnsBBoxAtLine(q, text), line.timer?.text];
    }
    throw new Error("unexpected");
  }

  showAllLines() {
    for (let ix = this.lines.length; ix < this.q!.body.length; ++ix) {
      this.showLine(ix, false, false);
    }
  }
  createCaption() {
    const b = this.captionBounding
    this.textSize = this.calcTextSize([this.q!.ref], this.textWI, b.height);
    this.caption = this.add_text(b.centerX, b.centerY, { backgroundColor: "#fff" }, this.q!.ref.t, {})
  }
  create(data: { soundOn: boolean, q: integer, practice: boolean, qkind: string },) {
    this.add.image(0, 0, 'bg').setOrigin(0, 0).setDepth(depth.bg);
    this.qkind = data.qkind;
    this.lines = [];
    this.phase = new TryingPhase(this)
    this.soundOn = data.soundOn;
    this.graphics = this.add.graphics();
    this.resBase = this.add.graphics();
    this.practice = data.practice;
    this.graphics.setDepth(depth.emp);
    this.qix = data.q;
    this.q = qlist.Q[data.q] as QInfo
    this.createCaption()
    this.textSize = this.calcTextSize(this.q.body, this.textWI, this.linesBounding.height);
    this.tick = -0.5 * this.fps();
    this.prepareSounds(data.soundOn, [
      "b0", "b1", "b2", "b3", "b4", "b5", "b6", "b7",
      "fail", "giveup", "found",]);
  }
  preload() {
    this.load.image("bg", "assets/bg.webp");
    this.load.image("share", "assets/share.webp");
    this.loadAudios({
      b0: "bgm0.m4a",
      b1: "bgm1.m4a",
      b2: "bgm2.m4a",
      b3: "bgm3.m4a",
      b4: "bgm4.m4a",
      b5: "bgm5.m4a",
      b6: "bgm6.m4a",
      b7: "bgm7.m4a",
      fail: "fail.m4a",
      giveup: "giveup.m4a",
      found: "found.m4a",
    });
  }
  get lineStyle(): { [key: string]: string | number } {
    return {
      fontSize: `${this.textSize}px`,
      width: `${this.textW}px`,
      fixedWidth: this.textW,
      backgroundColor: "#fffa",
      align: "left",
    }
  }
  giveUpClicked() {
    this.phase = new GiveUpPhase(this)
  }
  gotoTitle() {
    for (const line of this.lines) {
      line.text.destroy();
      line.timer?.destroy();
    }
    this.lines = [];
    this.scene.start('Title', { soundOn: this.soundOn });
  }
  showGoToTitle() {
    const y = this.captionBounding.top;
    const x = this.timerLeft;
    const t = this.add_text(x, y, {}, "タイトルへ",
      { pointerdown: () => this.gotoTitle() }
    );
    t.setOrigin(0, 0);
  }
  showGiveUp() {
    if (this.giveUp != null) {
      return;
    }
    const y = this.captionBounding.top;
    const x = this.timerLeft;
    this.giveUp = this.add_text(x, y, {}, "GIVE UP",
      { pointerdown: () => this.giveUpClicked() }
    );
    this.giveUp.setOrigin(0, 0);
  }
  showLine(ix: integer, addTimer: boolean, sound: boolean) {
    const q = this.q
    if (!q) { return }
    const val = q.body[ix];
    if (!val) {
      this.sound.get("b0").play();
      this.showGiveUp();
      return
    }
    const height = this.linesBounding.height
    const y = height / q.body.length * (ix + 0.5) + this.linesBounding.top;
    const text = this.add_text(this.textC, y, this.lineStyle, val.t.join(""), {});
    text.on("pointerdown", () => {
      this.clicked(ix);
    }).setInteractive();
    const timer =
      (!this.practice && addTimer) ? this.add_text(this.timerC, y, {
        fontSize: "19px",
        fontFamily: "monospace",
        fixedWidth: this.timerW,
        backgroundColor: "#8f8a",
        align: "right",
      }, "", {}) : null
    this.lines[ix] = new Line(this.tick, timer, text);
    if (sound) {
      const s = `b${[
        1, 1, 1, 1,
        2, 1, 1, 1,
        4, 3, 4, 3,
        5, 6, 7,
      ][ix] || "1"
        }`;
      this.sound.get(s).play();
    }
  }
  clicked(ix: integer) {
    const line = this.q?.body[ix];
    if (line && 1 < line.t.length) {
      this.phase = new PraisePhase(this)
    } else {
      this.phase = new FailedPhase(this)
    }
  }
  updateTimers() {
    for (const line of this.lines) {
      const t = Math.round((this.tick - line.tick) / this.fps() * 100)
      const frac = t % 100
      const sec = (t - frac) / 100
      const fracS = `00${frac}`.slice(-2)
      line.timer?.setText(`${sec}.${fracS}`)
    }
  }
  update(t: number, d: number) {
    this.phase.update()
  }
}
