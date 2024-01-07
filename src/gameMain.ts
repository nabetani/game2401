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


export class GameMain extends BaseScene {
  q: QInfo | undefined
  textSize: number = 0
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
    this.q = Q[data.q] as QInfo
    this.textSize = this.calcTextSize(this.q.body, 480, 900);
    this.q.body.forEach((val, ix) => {
      this.add_text(256, (ix + 0.5) * 900 / 17, {
        fontSize: `${this.textSize}px`,
        width: "500px",
        fixedWidth: 500,
        align: "left",
      }, val.t, {});
    })
  }
  preload() {
  }
  update(t: number, d: number) {
  }
}
