import * as p2 from 'p2-es';
import { Historian, ChannelAABB2D } from 'nengi';
import { Entity } from '../common/types';

const lagCompensatedHitscanCheck = (
  channel: ChannelAABB2D,
  world: p2.World,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  timeAgo: number
) => {
  const historian: Historian | null = channel.historian;
  const hits: Entity[] = [];

  if (historian) {
    const compensatedEntityPositions = historian.getComputedLagCompensatedState(timeAgo);

    compensatedEntityPositions.forEach(entityProxy => {
      // look up the real entity
      const realEntity = channel.entities.get(entityProxy.nid) as Entity | undefined;
      if (realEntity && realEntity.body) {
        // Save current position
        const tempX = realEntity.x;
        const tempY = realEntity.y;
        const tempBodyPos = [...realEntity.body.position];

        // Rewind
        realEntity.x = entityProxy.x;
        realEntity.y = entityProxy.y;
        realEntity.body.position[0] = entityProxy.x;
        realEntity.body.position[1] = entityProxy.y;

        // Raycast setup
        const from = [x1, y1];
        const to = [x2, y2];
        const ray = new p2.Ray({
          from,
          to,
          mode: p2.Ray.CLOSEST,
          skipBackfaces: true,
          collisionMask: 0xffffffff,
        });
        const result = new p2.RaycastResult();
        world.raycast(result, ray);

        if (result.hasHit() && result.body === realEntity.body) {
          hits.push(realEntity);
        }

        // Restore
        realEntity.x = tempX;
        realEntity.y = tempY;
        realEntity.body.position[0] = tempBodyPos[0];
        realEntity.body.position[1] = tempBodyPos[1];
      }
    });
  }
  return hits;
};

export default lagCompensatedHitscanCheck;
