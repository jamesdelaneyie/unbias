import { NetworkType } from '../common/NetworkType';
import { ncontext } from '../common/ncontext';
import { Instance, NetworkEvent, ChannelAABB2D, Historian, AABB2D, User, Channel } from 'nengi';
import { uWebSocketsInstanceAdapter } from 'nengi-uws-instance-adapter';
import { Command, MoveCommand, ObjectEntity, UsernameCommand, Entity } from '../common/types';
import { PlayerEntity } from '../common/PlayerEntity';
import { createPlayerEntity, deletePlayerEntity } from '../server/EntityManager';
import { applyCommand } from './applyMoveCommand';
import * as p2 from 'p2-es';
import { config } from '../common/config';
import { loadMap } from './loadMap';
import lagCompensatedHitscanCheck from './lagCompensatedHitscanCheck';
import { ServerMessageType } from '../common/schemas/serverMessageSchema';

const instance = new Instance(ncontext);
const uws = new uWebSocketsInstanceAdapter(instance.network, {});
uws.listen(config.port, () => {
  console.log(`uws adapter is listening on ${config.port}`);
});

const historian = new Historian(ncontext, config.serverTickRate);
const space = new ChannelAABB2D(instance.localState, historian);
const main = new Channel(instance.localState);
const users = new Map<number, User>();

const staticEntities: Map<number, Entity> = new Map();
const dynamicEntities: Map<number, Entity> = new Map();
const ObjectEntities: Map<number, ObjectEntity> = new Map();
const playerEntities: Map<number, PlayerEntity> = new Map();

const world = new p2.World({ gravity: [0, 10], islandSplit: true });
// @ts-ignore
world.solver.iterations = 10;
world.defaultContactMaterial.friction = 0;
world.defaultContactMaterial.restitution = 0.1;

instance.onConnect = async (handshake: any) => {
  console.log('handshake received', handshake.token);
  return true;
};

const queue = instance.queue;
let mapLoaded = false;

const mapName = 'debugMap';

const update = () => {
  while (!queue.isEmpty()) {
    const networkEvent = queue.next();

    if (!mapLoaded) {
      mapLoaded = loadMap(space, world, staticEntities, dynamicEntities, mapName);
    }

    if (networkEvent.type === NetworkEvent.UserConnected) {
      const { user } = networkEvent;
      //console.log('user connected', user);
      const viewSize = 2200;
      const view = new AABB2D(0, 0, viewSize, viewSize);
      space.subscribe(user, view);
      main.addMessage({
        ntype: NetworkType.ServerMessage,
        message: 'Anonymous has joined the server',
        type: ServerMessageType.global,
      });
    }

    if (networkEvent.type === NetworkEvent.UserDisconnected) {
      const { user } = networkEvent;
      deletePlayerEntity(user, main, space, playerEntities, world);
    }

    if (networkEvent.type === NetworkEvent.CommandSet) {
      const { user, commands } = networkEvent;
      if (commands.length > 0) {
        commands.forEach((command: Command) => {
          if (command.ntype === NetworkType.MoveCommand) {
            const player = playerEntities.get(command.nid);
            const moveCommand = command as MoveCommand;
            if (player) {
              applyCommand(player, moveCommand);
            }
          }
          if (command.ntype === NetworkType.UsernameCommand) {
            const usernameCommand = command as UsernameCommand;
            const usernameTaken = Array.from(playerEntities.values()).find(
              entity => entity.username === usernameCommand.username
            );
            if (usernameTaken) {
              console.warn('Username already taken');
              return;
            }
            try {
              const player = createPlayerEntity(user, usernameCommand);
              if (player) {
                space.addEntity(player);
                main.addEntity(player);
                space.subscribe(user, player.view);
                main.subscribe(user);
                world.addBody(player.body);
                // @ts-ignore
                player.body.nid = player.nid;
                playerEntities.set(player.nid, player);
                dynamicEntities.set(player.nid, player);
                users.set(user.id, user);
                console.log('player created', player?.username);
                user.queueMessage({
                  myId: player.nid,
                  ntype: NetworkType.IdentityMessage,
                  username: usernameCommand.username,
                });
                main.addMessage({
                  ntype: NetworkType.ServerMessage,
                  message: `${usernameCommand.username} has joined the server`,
                  type: ServerMessageType.global,
                });
                space.addMessage({
                  ntype: NetworkType.ServerMessage,
                  message: `${usernameCommand.username} has joined the area`,
                  type: ServerMessageType.local,
                  x: player.x,
                  y: player.y,
                });
              }
            } catch (error) {
              console.error('Error creating player entity', error);
            }
          }
          if (command.ntype === NetworkType.ShotImpactCommand) {
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
              const from = [fromX, fromY];
              const to = [hitX, hitY];
              const ray = new p2.Ray({
                from: from,
                to: to,
                mode: p2.Ray.CLOSEST,
                collisionMask: 0xffffffff,
                skipBackfaces: true,
                callback: function (result) {
                  console.log('result', result);
                },
              });
              ray.update();

              const result = new p2.RaycastResult();
              world.raycast(result, ray);

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
              relativePoint = [
                hitX - hitEntity.body.position[0],
                hitY - hitEntity.body.position[1],
              ];

              const force = impactCommand.impactForce;
              // @ts-ignore
              if (hitEntity.username !== null) {
                const playerEntity = hitEntity as PlayerEntity;
                //console.log(force);
                playerEntity.health = Math.max(0, playerEntity.health - force);
                //console.log('damage', playerEntity.health);
              }

              hitEntity.body.applyImpulse(
                [normalizedX * force, normalizedY * force],
                relativePoint
              );

              // @ts-ignore
              if (hitEntity.health <= 0) {
                // @ts-ignore
                //console.log('playerEntity died', hitEntity.health);
                const playerEntity = hitEntity as PlayerEntity;
                playerEntity.isAlive = false;
                playerEntity.color = 0xff0000;
                playerEntity.body.type = p2.Body.STATIC;
                playerEntity.body.mass = 0;
                playerEntity.body.velocity = [0, 0];
                playerEntity.body.angularVelocity = 0;
                playerEntity.body.updateMassProperties();
                //deletePlayerEntity(playerEntity, main, space, playerEntities, world);
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
          }
        });
      }
    }
  }

  world.step(config.worldStepRate);

  world.on('beginContact', event => {
    const bodyA = event.bodyA;
    const bodyB = event.bodyB;

    let playerEntity = null;
    let objectEntity = null;

    const playerA = Array.from(playerEntities.values()).find(p => p.body === bodyA);
    const objectB = Array.from(ObjectEntities.values()).find(o => o.body === bodyB);
    if (playerA && objectB) {
      playerEntity = playerA;
      objectEntity = objectB;
    }

    const playerB = Array.from(playerEntities.values()).find(p => p.body === bodyB);
    const objectA = Array.from(ObjectEntities.values()).find(o => o.body === bodyA);
    if (playerB && objectA) {
      playerEntity = playerB;
      objectEntity = objectA;
    }

    if (playerEntity && objectEntity) {
      objectEntity.color = playerEntity.color;
    }
  });

  dynamicEntities.forEach(entity => {
    entity.x = entity.body.position[0];
    entity.y = entity.body.position[1];
    entity.rotation = entity.body.angle;
  });

  instance.step();
};

setInterval(() => {
  update();
}, 1000 / config.serverTickRate);
