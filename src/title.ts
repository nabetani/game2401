import * as Phaser from 'phaser';
import { WStorage } from './wstorage';
import { BaseScene } from './baseScene';
import qlist from './q.json'


const T0 = new Date("2024-01-15T04:00:00+09:00").getTime();
// const T0 = new Date("2023-12-28T04:00:00+09:00").getTime();
const TodayQ = Math.floor((new Date().getTime() - T0) / (24 * 60 * 60 * 1000));
const TodayQPlayed = WStorage.played(TodayQ);


export class Title extends BaseScene {
  soundOn: boolean = false;
  constructor() { super("Title") }
  preload() {
    this.load.image("title", "assets/title.webp");
  }
  startClicked(q: integer, practice: boolean) {
    if (WStorage.played(q)) {
      practice = true;
    }
    if (!practice) {
      WStorage.setPlayed(q);
    }
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
  create(data: { soundOn: boolean | undefined }) {
    this.add.image(0, 0, 'title').setOrigin(0, 0);
    const soundStyle = {
      fontSize: "35px",
    }
    const soundBtns: Phaser.GameObjects.Text[] = [];
    const setSoundOn = (on: boolean) => {
      this.soundOn = on;
      soundBtns[0].setScale(on ? 1 : 0.7);
      soundBtns[1].setScale(on ? 0.7 : 1);
    };
    soundBtns.push(this.add_text(220, 30, soundStyle, 'Sound ON', { pointerdown: () => setSoundOn(true) }));
    soundBtns.push(this.add_text(400, 30, soundStyle, 'Sound OFF', { pointerdown: () => setSoundOn(false) }));
    setSoundOn(data.soundOn || false);
    const todayBtn = this.addTodayButton();
    this.addStartButtons(todayBtn.getBounds());
    this.addLinks();
  }
  todayResult(): string {
    return WStorage.result(TodayQ);
  }
  addTodayButton(): Phaser.GameObjects.Text {
    const { width, height } = this.sys.game.canvas;
    if (TodayQ < 2) {
      return this.add_text(width / 2, height / 4, { fontSize: "65px" }, ' 明日公開 ', {});
    }
    if (TodayQPlayed) {
      const b = this.add_text(width / 2, height / 4, { fontSize: "55px" }, "今日の結果:", {});
      const bb = b.getBounds();
      return this.add_text(width / 2, bb.bottom + 50, { fontSize: "30px" }, this.todayResult(), {});
    }
    if (qlist.Q.length <= TodayQ) {
      return this.add_text(width / 2, height / 4, { fontSize: "40px" }, '問題の在庫切れ', {});
    }
    return this.add_text(width / 2, height / 4, { fontSize: "65px" }, '今日の問題',
      { pointerdown: () => this.startClicked(TodayQ, false) })
  }
  addStartButtons(rc: Phaser.Geom.Rectangle) {
    const { width, height } = this.sys.game.canvas;
    const bs = width * 0.4;
    for (let i = 0; i < 2; ++i) {
      const x = width / 2 - bs / 2 + bs * i
      this.add_text(x, rc.bottom + 40, { fontSize: "25px" }, `練習問題 ${i + 1}`,
        { pointerdown: () => this.startClicked(i, true) });
      const q = TodayQ - i - 1;
      if (1 < q && q < qlist.Q.length) {
        this.add_text(x, rc.bottom + 100, { fontSize: "25px" }, `${["昨日", "一昨日"][i]}の問題`,
          { pointerdown: () => this.startClicked(TodayQ - i - 1, true) });
      }
    }
  }
}

