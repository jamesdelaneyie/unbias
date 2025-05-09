import { Container, Graphics } from 'pixi.js';

const drawHitscan = (
  layer: Container,
  x: number,
  y: number,
  targetX: number,
  targetY: number,
  color: number
) => {
  const graphics = new Graphics()
    .stroke({ width: 0.02, color: color })
    .moveTo(x, y)
    .lineTo(targetX, targetY)
    .stroke({ width: 0.02, color: color });

  const startRadius = 0.5;
  const endRadius = 2;
  const duration = 120;
  const startTime = Date.now();

  const animate = () => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const currentRadius = startRadius + (endRadius - startRadius) * progress;

    graphics.clear();
    graphics
      .stroke({ width: 0.02, color: color })
      .moveTo(x, y)
      .lineTo(targetX, targetY)
      .stroke({ width: 0.02, color: color })
      .circle(targetX, targetY, currentRadius)
      .fill({ color: color, alpha: 0.2 });

    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  };

  layer.addChild(graphics);
  animate();

  setTimeout(() => {
    layer.removeChild(graphics);
    graphics.destroy({
      children: true,
      texture: true,
    });
  }, 120);
};

export { drawHitscan };
