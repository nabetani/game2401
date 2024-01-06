import * as Phaser from 'phaser';

export class Title extends Phaser.Scene {
  preload() {
    this.load.image("title", "assets/title.webp");
  }
  create() {
    this.add.image(0, 0, 'title').setOrigin(0, 0);
  }
}

