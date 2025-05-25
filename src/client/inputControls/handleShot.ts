import { drawHitscan } from '../graphics/drawHitscan';
import * as p2 from 'p2-es';
import { Container, Graphics } from 'pixi.js';
import { NetworkType } from '../../common/NetworkType';
import { ObjectEntityMap, PlayerEntityMap } from '@/common/types';
import { config } from '@/common/config';

const handleShot = (
  world: p2.World,
  x: number,
  y: number,
  tx: number,
  ty: number,
  worldContainer: Container,
  originNid: any,
  client: any,
  objectEntities: ObjectEntityMap,
  playerEntities: PlayerEntityMap
) => {
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
    },
  });
  ray.update();

  const result = new p2.RaycastResult();
  world.raycast(result, ray);

  let endX = tx;
  let endY = ty;
  if (result.hasHit()) {
    const hitPoint = result.getHitPoint([], ray);
    endX = hitPoint[0];
    endY = hitPoint[1];

    const debugMarker = new Graphics().circle(endX, endY, 0.3).fill({
      color: 0xff0000,
    });
    debugMarker.zIndex = 100;
    worldContainer.addChild(debugMarker);
    setTimeout(() => {
      worldContainer.removeChild(debugMarker);
      debugMarker.destroy();
    }, 1000);

    if (result.body) {
      // find nid of hit object
      let targetNid = 0;
      for (const [nid, obj] of objectEntities) {
        if (obj.body === result.body) {
          targetNid = nid;
          break;
        }
      }
      for (const [nid, obj] of playerEntities) {
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
        nid: originNid,
        originNid: originNid,
        targetNid: targetNid,
        fromX: x,
        fromY: y,
        hitX: endX,
        hitY: endY,
        impactForce: config.shotForce,
      });
    }
  }

  // Draw visual effect AFTER we know the final end point of the hitscan
  drawHitscan(worldContainer, x, y, endX, endY, 0xffffff);
};

export { handleShot };
