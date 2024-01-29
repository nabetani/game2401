import * as Phaser from 'phaser';
import { WStorage } from './wstorage';
import { BaseScene } from './baseScene';
import qlist from './q.json'


const T0 = new Date("2024-01-15T04:00:00+09:00").getTime();

export class Title extends BaseScene {
  soundOn: boolean = false;
  _todayQ: integer | null = null;
  get todayQKind(): string {
    const t = T0 + this.todayQ * (24 * 60 * 60 * 1000);
    const d = new Date(t);
    return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()} の問題`;
  }
  get todayQ(): integer {
    if (null === this._todayQ) {
      this._todayQ = Math.floor((new Date().getTime() - T0) / (24 * 60 * 60 * 1000));
    }
    return this._todayQ!;
  }
  get ruleConfirmed(): boolean {
    return WStorage.ruleConfirmed();
  }
  setRuleConfirmed() {
    WStorage.setRuleConfirmed();
  }
  get todayQPlayed(): boolean {
    return WStorage.played(this.todayQ);
  }
  constructor() { super("Title") }
  preload() {
    this.load.image("title", "assets/title.webp");
  }
  startClicked(q: integer, practice: boolean, qkind: string) {
    if (WStorage.played(q)) {
      practice = true;
    }
    if (!practice) {
      WStorage.setPlayed(q);
    }
    this.scene.start('GameMain', { soundOn: this.soundOn, q: q, practice: practice, qkind: qkind });
  }
  addLinks() {
    const tag = "タイツを探せ";
    let y = this.sys.game.canvas.height - 50;
    [
      ["Source code and license", "https://github.com/nabetani/game2401/"],
      ["鍋谷武典 @ タイッツー", "https://taittsuu.com/users/nabetani"],
      ["制作ノート", "https://nabetani.hatenadiary.com/entry/2024/01/game24b"],
      ["タイッツー #" + tag, "https://taittsuu.com/search/taiitsus/hashtags?query=" + tag],
    ].forEach((e, ix) => {
      const text = this.add_text(462, y, {}, e[0],
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
    soundBtns.push(this.add_text(190, 70, soundStyle, 'Sound ON', { pointerdown: () => setSoundOn(true) }));
    soundBtns.push(this.add_text(370, 70, soundStyle, 'Sound OFF', { pointerdown: () => setSoundOn(false) }));
    setSoundOn(data.soundOn || false);
    const todayBtn = this.addTodayButton();
    this.addStartButtons(todayBtn.getBounds());
    const { width } = this.sys.game.canvas;
    if (this.ruleConfirmed) {
      this.addShowRuleButton(width / 2, 500, { fontSize: "25px" });
    }
    this.addLinks();
  }
  todayResult(): string {
    return WStorage.result(this.todayQ);
  }
  showRule() {
    const { width, height } = this.sys.game.canvas;
    const msg = [
      "日本語の文章が 1行ずつ表示されます。",
      "表示された行に「たいつ」と読む部分があったら、その行をクリックしてください。",
      "句読点が等が挟まっていても、仮名にしたときに",
      "「た」「い」「つ」 が順に並んでいたらそれはタイツです。",
      "",
      "例1: ✅ また、いつか蝉丸が",
      "　　　→ 読点が挟まっていても良い",
      "例2: ✅ 失われた逸材に再び出会うために",
      "　　　→ 「逸材」は「いつざい」と読むので",
      "例3: ✅ 下か！　しまった……! いつの間に",
      "　　　→ 句読点のたぐいは何個挟まっていても良い",
      "例4: ✅ この椅子硬い。疲れた...",
      "　　　→ 「疲れた」は「つかれた」と読むので",
      "例5: ✅ この死体、ツアーコンダクターの",
      "　　　→ 片仮名でも平仮名でもタイツはタイツ",
      "例6: ❌ バッター、逸見",
      "　　　→ 音引き「ー」が挟まっている",
      "例7: ❌ キンメダイ釣りに来たはずなのに",
      "　　　→ 濁点のある「ダ」は「タイツ」の一部ではない",
      "例8: ❌ 痛いっ、なにするの！",
      "　　　→ 促音の「っ」は「たいつ」の一部ではない",
      "",
      "日本時間午前四時に問題が更新されます。",
      "今日の問題は、一日一回しか遊べません。",

    ].join("\n");
    const style = {
      wordWrap: { width: width * 0.9, useAdvancedWrap: true },
      fontSize: "18px",
      fixedWidth: width * 0.95,
      backgroundColor: "white",
    };
    const rule = this.add_text(width / 2, height / 2, style, msg,
      {
        pointerdown: () => {
          rule.destroy();
          if (!this.ruleConfirmed) {
            this.setRuleConfirmed();
            this.scene.start('Title', { soundOn: this.soundOn });
          }
        }
      });
  }
  addShowRuleButton(x: number, y: number, style: Phaser.Types.GameObjects.Text.TextStyle): Phaser.GameObjects.Text {
    return this.add_text(x, y, style, ' ルール説明 ',
      { pointerdown: () => this.showRule() });
  }
  addTodayButton(): Phaser.GameObjects.Text {
    const { width, height } = this.sys.game.canvas;
    if (!this.ruleConfirmed) {
      return this.addShowRuleButton(width / 2, height / 4, { fontSize: "65px" });
    }
    if (this.todayQ < 2) {
      return this.add_text(width / 2, height / 4, { fontSize: "65px" }, ' 明日公開 ', {});
    }
    if (this.todayQPlayed) {
      const b = this.add_text(width / 2, height / 4, { fontSize: "55px" }, "今日の結果:", {});
      const bb = b.getBounds();
      return this.add_text(width / 2, bb.bottom + 50, { fontSize: "30px" }, this.todayResult(), {});
    }
    if (qlist.Q.length <= this.todayQ) {
      return this.add_text(width / 2, height / 4, { fontSize: "40px" }, '問題の在庫切れ', {});
    }
    return this.add_text(width / 2, height / 4, { fontSize: "65px" }, '今日の問題',
      { pointerdown: () => this.startClicked(this.todayQ, false, this.todayQKind) })
  }
  addStartButtons(rc: Phaser.Geom.Rectangle) {
    const { width } = this.sys.game.canvas;
    for (let i = 0; i < 2; ++i) {
      const bs = width * 0.4;
      const x = width / 2 - bs / 2 + bs * i
      this.add_text(x, rc.bottom + 40, { fontSize: "25px" }, `練習問題 ${i + 1}`,
        { pointerdown: () => this.startClicked(i, true, "練習問題") });
    }
    const start = this.todayQPlayed ? 0 : 1;
    for (let i = start; i < 3; ++i) {
      const bs = width * 0.3;
      const x = width / 2 - bs + bs * i
      const q = this.todayQ - i;
      if (1 < q && q < qlist.Q.length) {
        const qk = `${["今日", "昨日", "一昨日"][i]}の問題`;
        this.add_text(x, rc.bottom + 100, { fontSize: "25px" }, qk,
          { pointerdown: () => this.startClicked(this.todayQ - i, true, qk) });
      }
    }
  }
}

