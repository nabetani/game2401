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

const GENERAL = "general";

export class WStorage {
  static ruleConfirmed(): boolean {
    return readWS<boolean>(GENERAL, "ruleConfirmed", false);
  }
  static setRuleConfirmed() {
    storeWS(GENERAL, "ruleConfirmed", true);
  }
  static played(qix: integer): boolean {
    return readWS<boolean>("played", `${qix}`, false);
  }
  static setPlayed(qix: integer) {
    storeWS("played", `${qix}`, true);
  }
  static result(qix: integer): string {
    return readWS<string>("result", `${qix}`, "記録なし");
  }
  static setResult(qix: integer, res: string) {
    storeWS("result", `${qix}`, res);
  }
}
