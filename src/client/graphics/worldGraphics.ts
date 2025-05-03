import { Application, Container, Graphics, Sprite } from 'pixi.js';

const createGridGraphics = (app: Application, worldContainer: Container, size: number) => {
  const gridContainer = new Container();
  gridContainer.label = 'gridContainer';
  gridContainer.interactive = false;
  gridContainer.x = 0;
  gridContainer.y = 0;
  const gridBorder = new Graphics()
    .rect(0, 0, size, size)
    .fill({ color: 0xffffff, alpha: 0.1 })
    .stroke({ color: 0xffffff, alpha: 0.6, width: 1 });
  gridContainer.addChild(gridBorder);
  const gridBorderTexture = app.renderer.generateTexture(gridBorder);
  gridBorder.destroy();

  const gridBorderSprite = new Sprite(gridBorderTexture);
  gridBorderSprite.anchor.set(0.5);
  gridBorderSprite.width = 10;
  gridBorderSprite.height = 10;
  gridContainer.addChild(gridBorderSprite);

  const gridLines = new Container();
  const gridLineSize = 20;

  for (let i = 0; i < size / gridLineSize; i++) {
    let line = new Graphics();
    line.moveTo(i * gridLineSize, 0);
    line.lineTo(i * gridLineSize, size);
    line.stroke({ color: 0xffffff, alpha: 0.3, width: 1 });
    gridLines.addChild(line);
  }

  for (let i = 0; i < size / gridLineSize; i++) {
    let line = new Graphics();
    line.moveTo(0, i * gridLineSize);
    line.lineTo(size, i * gridLineSize);
    line.stroke({ color: 0xffffff, alpha: 0.3, width: 1 });
    gridLines.addChild(line);
  }
  const gridLinesTexture = app.renderer.generateTexture(gridLines);
  gridLines.destroy();

  const gridLinesSprite = new Sprite(gridLinesTexture);
  gridLinesSprite.anchor.set(0.5);
  gridLinesSprite.width = 10;
  gridLinesSprite.height = 10;
  gridContainer.addChild(gridLinesSprite);

  worldContainer.addChild(gridContainer);
};

export { createGridGraphics };
