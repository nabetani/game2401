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
  body: QRef[]
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

  lines: Line[] = []
  constructor() {
    super("GameMain");
  }
  calcTextSize(lines: QRef[], w: number, h: number): number {
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
  create(data: { sound: boolean, q: integer },) {
    const { width, height } = this.sys.game.canvas
    this.q = Q[data.q] as QInfo
    this.textSize = this.calcTextSize(this.q.body, this.textWI, height);
    this.tick = -0.5 * this.fps();
  }
  preload() {
  }
  showLine(ix: integer) {
    const q = this.q
    const val = this.q!.body[ix]
    if (!q || !val) { return }
    const { width, height } = this.sys.game.canvas
    const lineH = height / q.body.length * 0.7
    const y = height / q.body.length * (ix + 0.5);
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
  update(t: number, d: number) {
    const prevLine = this.tick / this.fps() * LinePerSec
    ++this.tick;
    const curLine = this.tick / this.fps() * LinePerSec
    if (prevLine != curLine) {
      this.showLine(curLine);
    }
  }
}
