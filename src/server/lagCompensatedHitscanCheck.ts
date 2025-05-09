//import * as p2 from 'p2-es';
import { Historian, ChannelAABB2D } from 'nengi';

const lagCompensatedHitscanCheck = (
  channel: ChannelAABB2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  timeAgo: number
) => {
  //const hits = [];

  const historian: Historian | null = channel.historian;

  if (historian) {
    const compensatedEntityPositions = historian.getComputedLagCompensatedState(timeAgo);

    compensatedEntityPositions.forEach(entityProxy => {
      // look up the real entity
      const realEntity = channel.entities.get(entityProxy.nid);
      //const smoothEntity = channel.entities.get(entityProxy.nid + 1);

      if (realEntity && realEntity.collidable) {
        const tempX = realEntity.x;
        const tempY = realEntity.y;

        // rewind
        realEntity.x = entityProxy.x;
        realEntity.y = entityProxy.y;

        //const hit = CollisionSystem.checkLineCircle(x1, y1, x2, y2, realEntity.collider.circle);

        // restore
        realEntity.x = tempX;
        realEntity.y = tempY;

        /*if (hit) {
          hits.push(realEntity);
          hits.push(smoothEntity);
        }*/
      }
    });
  }
  //return hits;
};

export default lagCompensatedHitscanCheck;
