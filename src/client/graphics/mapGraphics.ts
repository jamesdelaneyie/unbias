import { Container, Graphics, Sprite } from 'pixi.js';

interface GridGraphicsOptions {
  width: number;
  height: number;
  color: number;
}

const createGridGraphics = ({ width, height, color }: GridGraphicsOptions) => {
  // @ts-ignore Access PIXI app from global context
  const app = globalThis.__PIXI_APP__;

  const gridContainer = new Container();
  gridContainer.label = 'gridContainer';
  gridContainer.interactive = false;
  gridContainer.x = 0;
  gridContainer.y = 0;

  const gridBorder = new Graphics()
    .rect(0, 0, width * 10, height * 10)
    .fill({ color: color, alpha: 0.1 })
    .stroke({ color: color, alpha: 1, width: 1, pixelLine: true });

  const gridBorderTexture = app.renderer.generateTexture(gridBorder);
  gridBorder.destroy();

  const gridBorderSprite = new Sprite(gridBorderTexture);
  gridBorderSprite.anchor.set(0.5);
  gridBorderSprite.width = width;
  gridBorderSprite.height = height;
  gridContainer.addChild(gridBorderSprite);

  const gridLines = new Container();
  const targetGridSize = 50;

  const gridWidth = width * 10;
  const gridHeight = height * 10;

  // get an even number of cells that fit the width and height
  const numCellsX = Math.floor(gridWidth / targetGridSize);
  const numCellsY = Math.floor(gridHeight / targetGridSize);

  const gridLineSpacingX = gridWidth / numCellsX;
  const gridLineSpacingY = gridHeight / numCellsY;

  // Draw vertical lines
  for (let i = 0; i <= numCellsX; i++) {
    let line = new Graphics();
    line.moveTo(i * gridLineSpacingX, 0);
    line.lineTo(i * gridLineSpacingX, gridHeight);
    line.stroke({ color: color, alpha: 1, width: 1, pixelLine: true });
    gridLines.addChild(line);
  }

  // Draw horizontal lines
  for (let i = 0; i <= numCellsY; i++) {
    let line = new Graphics();
    line.moveTo(0, i * gridLineSpacingY);
    line.lineTo(gridWidth, i * gridLineSpacingY);
    line.stroke({ color: color, alpha: 1, width: 1, pixelLine: true });
    gridLines.addChild(line);
  }
  const gridLinesTexture = app.renderer.generateTexture(gridLines);
  gridLines.destroy();

  const gridLinesSprite = new Sprite(gridLinesTexture);
  gridLinesSprite.anchor.set(0.5);
  gridLinesSprite.width = width;
  gridLinesSprite.height = height;
  gridLinesSprite.alpha = 0.3;
  gridContainer.addChild(gridLinesSprite);

  return gridContainer;
};

export { createGridGraphics };
