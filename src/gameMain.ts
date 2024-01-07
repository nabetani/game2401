import * as Phaser from 'phaser';
import { BaseScene } from './baseScene';
import { Q } from './q.json'

interface Range {
  start: integer,
  len: integer,
}

interface QLine {
  t: string
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
  constructor(scene: GameMain) {
    super(scene)
    scene.onGameEnd()
  }
}

class PraisePhase extends GameEndPhase {
  update() { }
}
class FailedPhase extends GameEndPhase {
  update() { }
}

export class GameMain extends BaseScene {
  q: QInfo | undefined
  tick: number = -1
  textSize: number = 0
  phase: Phase
  caption: Phaser.GameObjects.Text | undefined

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
      const t = this.add.text(0, -1000, line.t, s);
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

  onGameEnd() {
    this.setCaptionLink()
    this.showAllLines()
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
    this.q = Q[data.q] as QInfo
    this.createCaption()
    this.textSize = this.calcTextSize(this.q.body, this.textWI, this.linesBounding.height);
    this.tick = -0.5 * this.fps();
  }
  preload() {
  }
  showLine(ix: integer, addTimer: boolean) {
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
    const timer =
      addTimer ? this.add_text(this.timerC, y, {
        fontSize: "19px",
        fontFamily: "monospace",
        width: `${this.timerW}px`,
        fixedWidth: this.timerW,
        align: "right",
      }, "", {}) : null
    this.lines[ix] = new Line(this.tick, timer, text)
  }
  clicked(ix: integer) {
    const line = this.q?.body[ix];
    if (line && line.range) {
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
