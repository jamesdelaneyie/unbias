import { drawHitscan } from './graphics/drawHitscan';
import * as p2 from 'p2-es';
import { Container, Graphics } from 'pixi.js';
import { NetworkType } from '../common/NetworkType';
import { ObjectEntityMap } from '@/common/types';

const handleShot = (
  world: p2.World,
  x: number,
  y: number,
  tx: number,
  ty: number,
  worldContainer: Container,
  client: any,
  objectEntities: ObjectEntityMap
) => {
  /*
  var result = new p2.RaycastResult();
  var hitPoint = p2.vec2.create();
  var rayClosest = new p2.Ray({
    mode: p2.Ray.CLOSEST,
  });

  p2.vec2.copy(rayClosest.from, [x, y]);
  p2.vec2.copy(rayClosest.to, [tx, ty]);
  rayClosest.update();
  result.reset();
  world.raycast(result, rayClosest);
  result.getHitPoint(hitPoint, rayClosest);

  const debugMarker = new Graphics()
    .circle(hitPoint[0], hitPoint[1], 0.3)
    .fill({ color: 0xff0000 });
  debugMarker.zIndex = 100;
  worldContainer.addChild(debugMarker);
  */
  // Create ray from origin to target with precise settings
  const from = [x, y];
  const to = [tx, ty];
  const ray = new p2.Ray({
    from: from,
    to: to,
    mode: p2.Ray.CLOSEST,
    collisionMask: 0xffffffff,
    skipBackfaces: true,
    callback: function (result) {
      console.log(result);
    }, // Ensure we check against all collision groups
  });
  // Ensure internal ray data (direction, aabb) is up-to-date before raycasting
  ray.update();

  // Prepare result container
  const result = new p2.RaycastResult();
  console.log('result', result);
  console.log(result);
  world.raycast(result, ray);

  // Determine endpoint based on raycast result
  let endX = tx;
  let endY = ty;
  if (result.hasHit()) {
    // Get precise hit coordinates on the actual shape surface
    const hitPoint = result.getHitPoint([], ray);
    endX = hitPoint[0];
    endY = hitPoint[1];

    // Add visual debug marker at hit point to verify accuracy
    const debugMarker = new Graphics();
    debugMarker.beginFill(0xff0000);
    debugMarker.drawCircle(endX, endY, 0.3);
    debugMarker.endFill();
    debugMarker.zIndex = 100;
    worldContainer.addChild(debugMarker);
    setTimeout(() => {
      worldContainer.removeChild(debugMarker);
      debugMarker.destroy();
    }, 1000);

    if (result.body && client) {
      // find nid of hit object
      let targetNid = 0;
      for (const [nid, obj] of objectEntities) {
        if (obj.body === result.body) {
          targetNid = nid;
          break;
        }
      }
      if (targetNid === 0) {
        console.warn('Could not find object nid for hit body');
        console.log(result.body);
      }

      client.addCommand({
        ntype: NetworkType.ShotImpactCommand,
        nid: client.myId,
        targetNid: targetNid,
        fromX: x,
        fromY: y,
        hitX: endX,
        hitY: endY,
        impactForce: 200, // Even more force for clarity
      });
    }
  }

  // Draw visual effect AFTER we know the final end point of the hitscan
  drawHitscan(worldContainer, x, y, endX, endY, 0xffffff);
};

export { handleShot };
