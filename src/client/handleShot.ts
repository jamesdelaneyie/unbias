import { drawHitscan } from './graphics/drawHitscan';
import * as p2 from 'p2-es';
import { Container } from 'pixi.js';
const handleShot = (
  world: p2.World,
  x: number,
  y: number,
  tx: number,
  ty: number,
  worldContainer: Container
) => {
  // 1) Create a ray from origin to target
  const from = [x, y];
  const to = [tx, ty];
  const ray = new p2.Ray({ from: from, to: to, mode: p2.Ray.CLOSEST, skipBackfaces: true });

  // 2) Prepare a result container
  const result = new p2.RaycastResult();

  // The last arg true means “stop at first hit”
  world.raycast(result, ray);

  // 4) Determine endpoint
  let endX = tx;
  let endY = ty;
  if (result.hasHit()) {
    // Get the closest hit (if ALL was used it'll be sorted by distance)
    const hitPoint = result.getHitPoint([], ray);
    endX = hitPoint[0];
    endY = hitPoint[1];
  }

  // 5) Draw it
  drawHitscan(worldContainer, x, y, endX, endY, 0xffffff);
};

export { handleShot };
