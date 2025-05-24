import { Command, Entity, ObjectEntity } from '../../common/types';
import { NetworkType } from '../../common/NetworkType';
import { PerformanceMonitor } from '../PerformanceMonitor';
import * as p2 from 'p2-es';
import { ServerMessageType } from '../../common/schemas/serverMessageSchema';
import { PlayerEntity } from '../../common/types';
import { Channel } from 'nengi';
import { ChannelAABB2D } from 'nengi';
import { lagCompensatedHitscanCheck } from './lagCompensatedHitscanCheck';
import { RayPool } from '../PhysicsUtils';

export const applyShotCommand = (
  command: Command,
  dynamicEntities: Map<number, Entity>,
  ObjectEntities: Map<number, ObjectEntity>,
  playerEntities: Map<number, Entity>,
  bodiesToRemove: Set<p2.Body>,
  world: p2.World,
  rayPool: RayPool,
  performanceMonitor: PerformanceMonitor,
  space: ChannelAABB2D,
  main: Channel
) => {
  const impactCommand = command as any;

  // Get the hit point and shot vector
  const fromX = impactCommand.fromX;
  const fromY = impactCommand.fromY;
  const hitX = impactCommand.hitX;
  const hitY = impactCommand.hitY;

  //console.log('shot impact', fromX, fromY, hitX, hitY);

  // Calculate the exact shot vector direction
  const vectorX = hitX - fromX;
  const vectorY = hitY - fromY;

  // Normalize the vector
  const magnitude = Math.sqrt(vectorX * vectorX + vectorY * vectorY);
  const normalizedX = vectorX / magnitude;
  const normalizedY = vectorY / magnitude;

  const dynamicAndPlayerEntities = new Map([...dynamicEntities, ...playerEntities]);
  // Find the directly hit entity
  //console.log(impactCommand.targetNid);
  let hitEntity = dynamicAndPlayerEntities.get(impactCommand.targetNid);
  let relativePoint: [number, number] = [hitX, hitY];
  let impactPoint: [number, number] = [hitX, hitY];
  if (!hitEntity) {
    const raycastStart = performanceMonitor.startTiming('raycastTime');
    const from = [fromX, fromY];
    const to = [hitX, hitY];
    const ray = rayPool.getRay();
    ray.from = from;
    ray.to = to;
    ray.update();

    const result = new p2.RaycastResult();
    world.raycast(result, ray);

    // Return ray to pool after use
    rayPool.returnRay(ray);

    performanceMonitor.endTiming('raycastTime', raycastStart);

    //console.log('result', result);

    if (result.hasHit()) {
      const hitPoint = result.getHitPoint([], ray);
      impactPoint = [hitPoint[0], hitPoint[1]];

      let targetNid = 0;
      for (const [nid] of playerEntities) {
        // @ts-ignore
        if (nid === result.body?.nid && nid !== impactCommand.originNid) {
          targetNid = nid;
          break;
        }
      }
      // @ts-ignore
      for (const nid in Object.keys(ObjectEntities)) {
        // @ts-ignore
        if (nid === result.body?.nid && nid !== impactCommand.originNid) {
          // @ts-ignore
          targetNid = nid;
          break;
        }
      }
      hitEntity = playerEntities.get(targetNid);
      //console.log('bot hit', hitEntity?.username);
    }
  }

  //console.log('hitEntity', hitEntity);
  //lagCompensatedHitscanCheck
  //console.log('impactCommand', impactCommand.originNid);
  const player = playerEntities.get(impactCommand.originNid);
  // @ts-ignore
  const timeAgo = player?.socket.user.latency + 100;
  //console.log('timeAgo', timeAgo);
  lagCompensatedHitscanCheck(space, world, fromX, fromY, hitX, hitY, timeAgo);

  if (hitEntity && hitEntity.body && hitEntity.body.type !== p2.Body.STATIC) {
    // Calculate relative point vector in world coords (offset from body center)
    relativePoint = [hitX - hitEntity.body.position[0], hitY - hitEntity.body.position[1]];

    const force = impactCommand.impactForce;
    // @ts-ignore
    if (hitEntity.username !== null) {
      const playerEntity = hitEntity as PlayerEntity;
      //console.log(force);
      // @ts-ignore
      playerEntity.health = Math.max(0, playerEntity.health - force);
      //console.log('damage', playerEntity.health);
    }

    hitEntity.body.applyImpulse([normalizedX * force, normalizedY * force], relativePoint);

    // @ts-ignore
    if (hitEntity.health <= 0) {
      // @ts-ignore
      //console.log('playerEntity died', hitEntity.health);
      const playerEntity = hitEntity as PlayerEntity;
      playerEntity.isAlive = false;
      playerEntity.color = 0xff0000;

      // CRITICAL FIX: Properly clean up dead players
      // Mark for removal from physics world
      bodiesToRemove.add(playerEntity.body);

      // Remove from game entities
      playerEntities.delete(playerEntity.nid);
      dynamicEntities.delete(playerEntity.nid);
      space.removeEntity(playerEntity);
      main.removeEntity(playerEntity);

      main.addMessage({
        ntype: NetworkType.ServerMessage,
        message: `${playerEntity.username} has died`,
        type: ServerMessageType.global,
      });
    }

    main.addMessage({
      ntype: NetworkType.ServerMessage,
      // @ts-ignore
      message: `${hitEntity.username} was shot`,
      type: ServerMessageType.global,
    });
  }

  // local messages must include x and y for view culling
  space.addMessage({
    ntype: NetworkType.ShotImpactMessage,
    targetNid: hitEntity?.nid,
    fromX: fromX,
    fromY: fromY,
    x: impactPoint[0],
    y: impactPoint[1],
    force: impactCommand.impactForce,
  });
};
