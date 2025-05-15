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
  // Create ray from origin to target with precise settings
  const from = [x, y];
  const to = [tx, ty];
  const ray = new p2.Ray({
    from: from,
    to: to,
    mode: p2.Ray.CLOSEST,
    skipBackfaces: true,
    collisionMask: 0xffffffff, // Ensure we check against all collision groups
  });

  // Prepare result container
  const result = new p2.RaycastResult();
  world.raycast(result, ray);

  // Determine endpoint
  let endX = tx;
  let endY = ty;

  // Draw visual effect
  drawHitscan(worldContainer, x, y, endX, endY, 0xffffff);

  if (result.hasHit()) {
    // Get precise hit coordinates
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
      }
      // Calculate the exact vector based on the ray's direction
      //const vectorX = to[0] - from[0];
      //const vectorY = to[1] - from[1];
      //const magnitude = Math.sqrt(vectorX * vectorX + vectorY * vectorY);
      //const normalizedX = vectorX / magnitude;
      //const normalizedY = vectorY / magnitude;

      // Log hit information for debugging
      //console.log(`Shot hit: ${result.body.id} at exact point [${endX}, ${endY}]`);
      //console.log(`Shot vector: [${normalizedX}, ${normalizedY}]`);

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
};

export { handleShot };
