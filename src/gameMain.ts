import * as Phaser from 'phaser';
import { BaseScene } from './baseScene';
import { Q } from './q.json'

interface Range {
  start: integer,
  len: integer,
}

interface QLine {
  t: string
  s: "title" | undefined
  range: Range | undefined
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

class Line {
  tick: number
  timer: Phaser.GameObjects.Text
  text: Phaser.GameObjects.Text
  constructor(tick: number, timer: Phaser.GameObjects.Text, text: Phaser.GameObjects.Text) {
    this.tick = tick
    this.timer = timer
    this.text = text
  }
}

export class GameMain extends BaseScene {
  q: QInfo | undefined
  tick: number = -1
  textSize: number = 0
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
      const t = this.add.text(0, -1000, line.t, s);
      const aw = t.getBounds().width;
      const ah = t.getBounds().height;
      size = Math.min(size, 10 * w / aw, 10 * maxH / ah);
      t.destroy(true)
    }
    return size;
  }
  createCaption() {
    const b = this.captionBounding
    this.textSize = this.calcTextSize([this.q!.ref], this.textWI, b.height);
    this.add_text(b.centerX, b.centerY, {}, this.q!.ref.t, {})
  }
  create(data: { sound: boolean, q: integer },) {
    this.q = Q[data.q] as QInfo
    this.createCaption()
    this.textSize = this.calcTextSize(this.q.body, this.textWI, this.linesBounding.height);
    this.tick = -0.5 * this.fps();
  }
  preload() {
  }
  showLine(ix: integer) {
    const q = this.q
    const val = this.q!.body[ix]
    if (!q || !val) { return }
    const height = this.linesBounding.height
    const y = height / q.body.length * (ix + 0.5) + this.linesBounding.top;
    const text = this.add_text(this.textC, y, {
      fontSize: `${this.textSize}px`,
      width: `${this.textW}px`,
      fixedWidth: this.textW,
      align: "left",
    }, val.t, {});
    text.on("pointerdown", () => {
      this.clicked(ix);
    }).setInteractive();
    const timer = this.add_text(this.timerC, y, {
      fontSize: "19px",
      fontFamily: "monospace",
      width: `${this.timerW}px`,
      fixedWidth: this.timerW,
      align: "right",
    }, "012:34", {});
    this.lines[ix] = new Line(this.tick, timer, text)
  }
  clicked(ix: integer) {
    console.log({ clicked: ix })
  }
  updateTimers() {
    for (const line of this.lines) {
      const t = Math.round((this.tick - line.tick) / this.fps() * 100)
      const frac = t % 100
      const sec = (t - frac) / 100
      const fracS = `00${frac}`.slice(-2)
      line.timer.setText(`${sec}.${fracS}`)
    }
  }
  update(t: number, d: number) {
    const prevLine = this.tick / this.fps() * LinePerSec
    ++this.tick;
    const curLine = this.tick / this.fps() * LinePerSec
    if (prevLine != curLine) {
      this.showLine(curLine);
    }
    this.updateTimers()
  }
}
