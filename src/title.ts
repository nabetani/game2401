import * as Phaser from 'phaser';
import { BaseScene } from './baseScene';

// Array.new(25){[*?a..?z,*?A..?Z,*0..9].sample}.join+"."
const APP_WS_ID = "0gjpKhzYK28hEzJQTThEfec5n."

const storeWS = (name: string, key: string, val: any) => {
  const s = localStorage;
  const wsKey = APP_WS_ID + name;
  const v = JSON.parse(s.getItem(wsKey) || "{}");
  v[key] = val;
  console.log(["storeWS", v]);
  s.setItem(wsKey, JSON.stringify(v));
}

const readWS = <T>(name: string, key: string, fallback: T): T => {
  const s = localStorage;
  const wsKey = APP_WS_ID + name;
  const v = JSON.parse(s.getItem(wsKey) || "{}");
  console.log(["readWS", v]);
  const r = v[key];
  if (r === undefined) {
    return fallback;
  }
  return r;
}

const T0 = new Date("2024-01-15T04:00:00+09:00").getTime();
const TodayQ = Math.floor((new Date().getTime() - T0) / (24 * 60 * 60 * 1000));
const TodayQPlayed = readWS<boolean>("played", `${TodayQ}`, false);


export class Title extends BaseScene {
  soundOn: boolean = false;
  constructor() { super("Title") }
  preload() {
    this.load.image("title", "assets/title.webp");
  }
  startClicked(q: number, practice: boolean) {
    if (readWS<boolean>("played", `${q}`, false)) {
      practice = true;
    }
    if (!practice) {
      storeWS("played", `${q}`, true);
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
  create() {
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
    const todayBtn = this.addTodayButton();
    this.addStartButtons(todayBtn.getBounds());
    this.addLinks();
  }
  todayResult(): string {
    return readWS<string>("result", `${TodayQ}`, "記録なし");
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
      if (1 < TodayQ - i - 1) {
        this.add_text(x, rc.bottom + 100, { fontSize: "25px" }, `${["昨日", "一昨日"][i]}の問題`,
          { pointerdown: () => this.startClicked(TodayQ - i - 1, true) });
      }
    }
  }
}

