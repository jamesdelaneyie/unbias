import { Container, Graphics } from 'pixi.js';

const drawHitscan = (
  layer: Container,
  x: number,
  y: number,
  targetX: number,
  targetY: number,
  color: number
) => {
  const duration = 350;

  const lineGraphics = new Graphics()
    .moveTo(x, y)
    .lineTo(targetX, targetY)
    .stroke({ width: 1, color: color, pixelLine: true });
  lineGraphics.zIndex = 1;
  layer.addChild(lineGraphics);

  const origin = new Graphics();
  origin.zIndex = 2;
  origin.circle(x, y, 0.5);
  origin.fill({ color: 0xffffff });
  layer.addChild(origin);

  // Graphics for the red impact dot
  const impactDotGraphics = new Graphics();
  impactDotGraphics.zIndex = 2;
  impactDotGraphics.circle(targetX, targetY, 0.5); // Small radius for the dot
  impactDotGraphics.fill({ color: 0xff0000 });
  layer.addChild(impactDotGraphics);

  // Remove all graphics after the duration
  setTimeout(() => {
    if (lineGraphics.parent) {
      layer.removeChild(lineGraphics);
    }
    lineGraphics.destroy({ children: true, texture: true });

    if (impactDotGraphics.parent) {
      layer.removeChild(impactDotGraphics);
    }
    impactDotGraphics.destroy({ children: true, texture: true });

    if (origin.parent) {
      layer.removeChild(origin);
    }
    origin.destroy({ children: true, texture: true });
  }, duration);
};

export { drawHitscan };
