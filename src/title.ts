import * as Phaser from 'phaser';
import { BaseScene } from './baseScene';

const T0 = new Date("2024-01-18T04:00:00+09:00").getTime();
const TodayQ = Math.floor((new Date().getTime() - T0) / (24 * 60 * 60 * 1000));

export class Title extends BaseScene {
  soundOn: boolean = false;
  constructor() { super("Title") }
  preload() {
    this.load.image("title", "assets/title.webp");
  }
  startClicked(q: number, practice: boolean) {
    this.scene.start('GameMain', { soundOn: this.soundOn, q: q, practice: practice });
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
        { pointerdown: () => { this.setLocation(e[1]) } });
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
    const todayBtn = (1 < TodayQ)
      ? this.add_text(width / 2, height / 4, { fontSize: "65px" }, '今日の問題',
        { pointerdown: () => this.startClicked(TodayQ, false) })
      : this.add_text(width / 2, height / 4, { fontSize: "65px" }, ' 明日公開 ', {});
    this.addStartButtons(todayBtn.getBounds());
    this.addLinks();
  }
  addStartButtons(rc: Phaser.Geom.Rectangle) {
    const bw = rc.width * 0.45;
    const bs = rc.width - bw;
    for (let i = 0; i < 2; ++i) {
      const x = rc.left + bw / 2 + bs * i
      this.add_text(x, rc.bottom + 40, { fontSize: "25px" }, `練習問題 ${i + 1}`,
        { pointerdown: () => this.startClicked(i, true) });
      if (1 < TodayQ - i - 1) {
        this.add_text(x, rc.bottom + 100, { fontSize: "25px" }, `${["昨日", "一昨日"][i]}の問題`,
          { pointerdown: () => this.startClicked(TodayQ - i - 1, true) });
      }
    }
  }
}

