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

const LinePerSec = 1 / 2

const GRWon = {
  c: 0x33ff33,
  text: (t: string | undefined): string => {
    return t ? `勝利!\n${t}秒` : "勝利";
  },
  resText: (t: string | undefined): string => {
    return t ? `勝利! / ${t}秒` : "勝利";
  },
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
  borderCol: 0xaa0000,
};
const GRGaveUp = {
  c: 0xff0000,
  text: (t: string | undefined): string => {
    return "よく頑張ったね";
  },
  resText: (t: string | undefined): string => {
    return "記録なし";
  },
  borderCol: 0xaa00ff,
};

interface GameResultType {
  c: integer
  text: (t: string | undefined) => string;
  resText: (t: string | undefined) => string;
  borderCol: integer;
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

type Phase = TryingPhase | PraisePhase | FailedPhase;

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
  update() {
    const prevLine = this.scene.tick / this.scene.fps() * LinePerSec
    ++this.scene.tick;
    const curLine = this.scene.tick / this.scene.fps() * LinePerSec
    if (prevLine != curLine) {
      this.scene.showLine(curLine, true);
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

export class GameMain extends BaseScene {
  q: QInfo | undefined
  qix: integer = -1;
  tick: number = -1
  textSize: number = 0
  phase: Phase
  ansBBox: Phaser.Geom.Rectangle | undefined
  caption: Phaser.GameObjects.Text | undefined
  graphics: Phaser.GameObjects.Graphics | undefined
  resBase: Phaser.GameObjects.Graphics | undefined
  practice: boolean = true;

  ansCol: integer = 0;

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

  lines: Line[] = []
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

  onGameEnd(gr: GameResultType) {
    this.ansCol = gr.c;
    this.setCaptionLink();
    this.showAllLines();
    const [bb, resTick] = this.getAnsBBox();
    this.ansBBox = bb;
    const h = this.sys.game.canvas.height;
    const ty = (this.ansBBox!.centerY < h / 2 ? 0.75 : 0.25) * h;
    const text = this.add_text(this.sys.game.canvas.width / 2, ty, {
      fontSize: "80px",
      align: "center",
      backgroundColor: "#0000",
    }, gr.text(resTick), {});
    WStorage.setResult(this.qix, gr.resText(resTick));
    text.setDepth(depth.result);
    const base = this.resBase!
    const resBB = text.getBounds();
    const g = 20;
    const params: [number, number, number, number, number] =
      [resBB.x - g, resBB.y - g, resBB.width + g * 2, resBB.height + g * 2, 30];
    base.fillStyle(0xffffff);
    base.fillRoundedRect(...params);
    base.lineStyle(20, gr.borderCol, 1.0);
    base.strokeRoundedRect(...params);
    base.setDepth(depth.resultBase);
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

  getAnsBBox(): [Phaser.Geom.Rectangle | undefined, string?] {
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
      this.showLine(ix, false);
    }
  }
  createCaption() {
    const b = this.captionBounding
    this.textSize = this.calcTextSize([this.q!.ref], this.textWI, b.height);
    this.caption = this.add_text(b.centerX, b.centerY, {}, this.q!.ref.t, {})
  }
  create(data: { sound: boolean, q: integer, practice: boolean },) {
    this.graphics = this.add.graphics();
    this.resBase = this.add.graphics();
    this.practice = data.practice;
    this.graphics.setDepth(depth.emp);
    this.qix = data.q;
    this.q = qlist.Q[data.q] as QInfo
    this.createCaption()
    this.textSize = this.calcTextSize(this.q.body, this.textWI, this.linesBounding.height);
    this.tick = -0.5 * this.fps();
  }
  preload() {
  }
  get lineStyle(): { [key: string]: string | number } {
    return {
      fontSize: `${this.textSize}px`,
      width: `${this.textW}px`,
      fixedWidth: this.textW,
      align: "left",
    }
  }
  showLine(ix: integer, addTimer: boolean) {
    const q = this.q
    const val = this.q!.body[ix]
    if (!q || !val) { return }
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
        align: "right",
      }, "", {}) : null
    this.lines[ix] = new Line(this.tick, timer, text)
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
