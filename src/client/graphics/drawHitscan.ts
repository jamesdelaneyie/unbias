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

  graphics.zIndex = 1;

  // Enhance impact visual effect
  const startRadius = 0.1;
  const maxRadius = 3;
  const duration = 350; // Longer animation
  const startTime = Date.now();

  // Create a shockwave effect
  const impactGraphics = new Graphics();
  impactGraphics.zIndex = 2;
  layer.addChild(impactGraphics);

  const animate = () => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Beam effect (laser trail)
    const beamOpacity = 1 - progress;
    graphics.clear();
    graphics
      .stroke({ width: 0.02, color: color, alpha: beamOpacity })
      .moveTo(x, y)
      .lineTo(targetX, targetY);

    // Impact effect
    if (progress < 1) {
      const currentRadius = startRadius + (maxRadius - startRadius) * progress;
      const ringThickness = 0.1 + 0.2 * (1 - progress); // Thicker at start, thinner at end
      const innerRadius = Math.max(0, currentRadius - ringThickness);

      // Multiple rings for shockwave effect
      impactGraphics.clear();

      // Main impact circle
      impactGraphics
        .circle(targetX, targetY, currentRadius)
        .fill({ color: color, alpha: 0.3 * (1 - progress) });

      // Outer ring
      impactGraphics
        .circle(targetX, targetY, currentRadius)
        .stroke({ width: ringThickness, color: color, alpha: 0.8 * (1 - progress) });

      // Inner ring for more detail
      if (progress > 0.2) {
        const secondRingRadius = innerRadius * 0.7;
        impactGraphics
          .circle(targetX, targetY, secondRingRadius)
          .stroke({ width: ringThickness * 0.7, color: color, alpha: 0.6 * (1 - progress) });
      }

      requestAnimationFrame(animate);
    } else {
      impactGraphics.clear();
      layer.removeChild(impactGraphics);
      impactGraphics.destroy({ children: true, texture: true });
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
  }, duration);
};

export { drawHitscan };
