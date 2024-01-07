import * as Phaser from 'phaser';
import { BaseScene } from './baseScene';

export class Title extends BaseScene {
  soundOn: boolean = false;
  constructor() { super("Title") }
  preload() {
    this.load.image("title", "assets/title.webp");
  }
  startClicked() {
    this.scene.start('GameMain', { soundOn: this.soundOn, q: 0 });
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

