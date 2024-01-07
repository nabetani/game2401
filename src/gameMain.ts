import * as Phaser from 'phaser';
import { BaseScene } from './baseScene';
import { Q } from './q.json'

export class GameMain extends BaseScene {
  constructor() {
    super("GameMain");
    console.log(Q);
  }
  create(data: { sound: boolean }) {
  }
  preload() {
  }
}
