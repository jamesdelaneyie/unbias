import { Container, Graphics } from 'pixi.js';

const drawHitscan = (
  layer: Container,
  x: number,
  y: number,
  targetX: number,
  targetY: number,
  color: number // This is the beam color, let's keep it for the line
) => {
  const duration = 350; // Duration for visuals to remain visible
  console.log('drawHitscan', x, y, targetX, targetY, color);
  // Graphics for the beam line
  const lineGraphics = new Graphics()
    .moveTo(x, y)
    .lineTo(targetX, targetY)
    .stroke({ width: 1, color: 0xffffff, pixelLine: true });
  lineGraphics.zIndex = 1;
  layer.addChild(lineGraphics);

  // Graphics for the red impact dot
  const impactDotGraphics = new Graphics();
  impactDotGraphics.zIndex = 2;
  impactDotGraphics.fill({ color: 0xff0000 }); // Red color for the dot
  impactDotGraphics.circle(targetX, targetY, 0.05); // Small radius for the dot
  //layer.addChild(impactDotGraphics);

  // Graphics for the white circle
  const whiteCircleRadius = 0.5; // Radius for the larger white circle
  const whiteCircleGraphics = new Graphics();
  whiteCircleGraphics.zIndex = 2;
  whiteCircleGraphics.stroke({ width: 0.03, color: 0xffffff }); // White color for the circle
  whiteCircleGraphics.circle(targetX, targetY, whiteCircleRadius);
  //layer.addChild(whiteCircleGraphics);

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

    if (whiteCircleGraphics.parent) {
      layer.removeChild(whiteCircleGraphics);
    }
    whiteCircleGraphics.destroy({ children: true, texture: true });
  }, duration);
};

export { drawHitscan };
