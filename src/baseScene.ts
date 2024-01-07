import * as Phaser from 'phaser';

export class BaseScene extends Phaser.Scene {
  add_text(x: number, y: number, style: { [key: string]: string | number }, msg: string, events: { [key: string]: (() => void) }): Phaser.GameObjects.Text {
    const s = {
      fontFamily: 'sans-serif',
      color: "black",
      padding: { x: 3, y: 3 },
      fontSize: "19px",
      backgroundColor: "#fffa",
      lineSpacing: 10,
      ...style
    };
    const o = this.add.text(x, y, msg, s);
    o.setOrigin(0.5, 0.5);
    for (const [k, v] of Object.entries(events)) {
      o.on(k, v);
      o.setInteractive();
    }
    return o;
  }
}
