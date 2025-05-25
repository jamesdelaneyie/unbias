import { Container, Graphics } from 'pixi.js';

export class Crosshairs extends Container {
  private color: number = 0xffffff;
  private lineWidth: number = 1;
  private graphics: Graphics;

  constructor() {
    super();
    this.x = 0;
    this.y = 0;
    this.width = 10;
    this.height = 10;
    this.color = 0x00ff00;
    this.lineWidth = 0.1;

    this.graphics = new Graphics();
    this.addChild(this.graphics);

    this.drawCrosshairs();
  }

  private drawCrosshairs(): void {
    this.graphics.clear();

    const width = 2;
    const height = 2;

    this.graphics.circle(0, 0, width / 2).stroke({
      color: this.color,
      width: this.lineWidth,
    });

    /*this.graphics.circle(0, 0, this.width / 2).stroke({
      color: this.color,
      width: this.lineWidth,
    });*/

    this.graphics
      .moveTo(-width / 2, 0)
      .lineTo(width / 2, 0)
      .moveTo(0, -height / 2)
      .lineTo(0, height / 2)
      .stroke({
        color: this.color,
        width: this.lineWidth,
      });
  }
}
