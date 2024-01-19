import * as Phaser from 'phaser';
import { BaseScene } from './baseScene';
import qlist from './q.json'

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
  t: "won",
  c: 0x33ff33,
};
const GRFailed = {
  t: "failed",
  c: 0xff0000,
};
const GRGaveUp = {
  t: "gave up",
  c: 0xff0000,
};

interface GameResultType {
  t: string
  c: integer
};

const depth = {
  "bg": 0,
  "text": 10,
  "emp": 11,
  "result": 12,
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

const randnum = (i: integer, lo: number, hi: number): number => {
  const v = hasher(i);
  console.log({ i: i, v: v });
  return lo + (hi - lo) * v;
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
  tick: number = -1
  textSize: number = 0
  phase: Phase
  ansBBox: Phaser.Geom.Rectangle | undefined
  caption: Phaser.GameObjects.Text | undefined
  graphics: Phaser.GameObjects.Graphics | undefined
  ansCol: integer = 0;

  get timerRight(): number {
    const w = this.sys.game.canvas.width
    return w / 7;
  }
  get timerLeft(): number {
    return 10
  }
  get timerW(): number {
    return this.timerRight - this.timerLeft
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
    this.ansBBox = this.getAnsBBox();
    const h = this.sys.game.canvas.height;
    const ty = (this.ansBBox!.centerY < h / 2 ? 0.75 : 0.25) * h;
    const text = this.add_text(this.sys.game.canvas.width / 2, ty, {}, gr.t, {});
  }

  getAnsBBoxAtLine(q: QLine, text: Phaser.GameObjects.Text): Phaser.Geom.Rectangle {
    const b = text.getBounds();
    let x = b.left
    let r = new Phaser.Geom.Rectangle();
    q.t.every((t, ix) => {
      const padding = (ix == 0
        ? { left: 3, y: 3, right: 0 }
        : { x: 0, y: 3 })
      const s = { ...this.lineStyle, fixedWidth: 0, padding: padding };
      const p = this.add_text(x, b.centerY, s, t, {});
      p.setOrigin(0, 0.5);
      if (ix == 1) {
        r = p.getBounds();
        p.destroy();
        return false; // break
      }
      x = p.getBounds().right;
      p.destroy();
      return true; // continue
    });
    return r;
  }

  emphasize(r: number) {
    const bbox = this.ansBBox!;
    const g = this.graphics!;
    g.clear();
    const c = new Phaser.Geom.Point(bbox.centerX, bbox.centerY);
    const d0 = bbox.width / 3 + 400 * Math.max(0, 1 - r * 2);
    const N = 40;
    console.log({ c: c, d: d0, bbox: bbox });
    const h = this.sys.game.canvas.height;
    g.fillStyle(this.ansCol, 0.5);
    // g.fillRect(bbox.left, bbox.top, bbox.width, bbox.height);
    for (let i = 0; i < N; ++i) {
      const t = (i + randnum(i + N * 2, 0, 0.7) + r * 4) * Math.PI * 2 / N;
      const d = randnum(i, 0.5, 2) * d0
      const dt = Math.PI * 2 / N * randnum(i + N, 0.05, 0.2);
      const [y0, x0] = sincos_r(t, d, c);
      const [y1, x1] = sincos_r(t + dt, h, c);
      const [y2, x2] = sincos_r(t - dt, h, c);
      g.fillTriangle(x0, y0, x1, y1, x2, y2);
    }
  }

  getAnsBBox(): Phaser.Geom.Rectangle | undefined {
    for (let ix = 0; ix < this.q!.body.length; ++ix) {
      const q = this.q!.body[ix]!;
      if (q.t.length < 2) { continue }
      const text = this.lines[ix].text;
      return this.getAnsBBoxAtLine(q, text);
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
  create(data: { sound: boolean, q: integer },) {
    this.graphics = this.add.graphics();
    this.graphics.setDepth(depth.emp);
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
      addTimer ? this.add_text(this.timerC, y, {
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
