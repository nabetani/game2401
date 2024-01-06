import * as Phaser from 'phaser';

const objectIsEmpty = (o: { [key: string]: any }): boolean => {
  for (const _ of Object.entries(o)) {
    return false;
  }
  return true;
}

export class Title extends Phaser.Scene {
  soundOn: boolean = false;
  preload() {
    this.load.image("title", "assets/title.webp");
  }
  add_text(x: number, y: number, style: { [key: string]: string }, msg: string, events: { [key: string]: (() => void) }): Phaser.GameObjects.Text {
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
    if (!objectIsEmpty(events)) {
      for (const [k, v] of Object.entries(events)) {
        o.on(k, v);
      }
      o.setInteractive();
    }
    return o;
  }
  startClicked() {
    this.scene.start('GameMain', { soundOn: this.soundOn });
  }
  addLinks() {
    const tag = "tbd";
    let y = this.sys.game.canvas.height - 10;
    [
      ["Source code and license", "https://github.com/nabetani/game2401/"],
      ["鍋谷武典 @ タイッツー", "https://taittsuu.com/users/nabetani"],
      ["制作ノート", "https://nabetani.hatenadiary.com/entry/2024/01/game24b"],
      ["タイッツー #" + tag, "https://taittsuu.com/search/taiitsus/hashtags?query=" + tag],
    ].forEach((e, ix) => {
      const text = this.add_text(500, y, {}, e[0],
        { pointerdown: () => { window.location.href = e[1]; } });
      text.setOrigin(1, 1);
      y = text.getBounds().top - 10;
    });
  }
  create() {
    const { width, height } = this.sys.game.canvas;
    this.add.image(0, 0, 'title').setOrigin(0, 0);
    const soundStyle = {
      fontSize: "35px",
    }
    const soundBtns: Phaser.GameObjects.Text[] = [];
    const toggleSound = (on: boolean) => {
      this.soundOn = on;
      soundBtns[0].setScale(on ? 1 : 0.7);
      soundBtns[1].setScale(on ? 0.7 : 1);
    };
    soundBtns.push(this.add_text(220, 30, soundStyle, 'Sound ON', { pointerdown: () => toggleSound(true) }));
    soundBtns.push(this.add_text(400, 30, soundStyle, 'Sound OFF', { pointerdown: () => toggleSound(false) }));
    toggleSound(false);
    this.add_text(width / 2, height / 2, { fontSize: "35px" }, 'Click here to start game',
      { pointerdown: () => this.startClicked() })
    this.addLinks();
  }
}

