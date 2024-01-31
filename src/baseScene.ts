import * as Phaser from 'phaser';

export class BaseScene extends Phaser.Scene {
  setLocation(url: string) {
    if (!window.open(url)) {
      location.href = url;
    }
  }

  fps(): number { return this.game.config.fps.target!; }
  add_text(x: number, y: number, style: Phaser.Types.GameObjects.Text.TextStyle, msg: string, events: { [key: string]: (() => void) }): Phaser.GameObjects.Text {
    const bg = Object.keys(events).length == 0 ? "#fff0" : "#fffa";
    const s = {
      fontFamily: 'sans-serif',
      color: "black",
      padding: { x: 3, y: 3 },
      fontSize: "19px",
      backgroundColor: bg,
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
  loadAudios(kv: { [key: string]: string; }) {
    for (let [key, value] of Object.entries(kv)) {
      this.load.audio(key, `assets/${value}`);
    }
  }
  prepareSounds(soundOn: boolean, values: string[]) {
    const conf: Phaser.Types.Sound.SoundConfig = soundOn ? {} : { mute: true, volume: 0 };
    for (const value of values) {
      const s = this.sound.get(value);
      if (s) { s.destroy(); }
      this.sound.add(value, conf);
    }
  }
}
