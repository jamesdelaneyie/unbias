import { NetworkType } from '../common/NetworkType';
import { ncontext } from '../common/ncontext';
import { Instance, NetworkEvent, ChannelAABB2D, Historian, AABB2D, User, Channel } from 'nengi';
import { uWebSocketsInstanceAdapter } from 'nengi-uws-instance-adapter';
import { Command, MoveCommand, ObjectEntity, UsernameCommand, Entity } from '../common/types';
import { PlayerEntity } from '../common/PlayerEntity';
import { createPlayerEntity, deletePlayerEntity } from '../server/EntityManager';
import { applyCommand } from './applyMoveCommand';
import * as p2 from 'p2-es';
import { worldConfig } from '../common/worldConfig';
import { populateWorld } from './loadMap';

const instance = new Instance(ncontext);
const uws = new uWebSocketsInstanceAdapter(instance.network, {});
uws.listen(worldConfig.port, () => {
  console.log(`uws adapter is listening on ${worldConfig.port}`);
});

const historian = new Historian(ncontext, worldConfig.serverTickRate);
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
let worldPopulated = false;

const update = () => {
  while (!queue.isEmpty()) {
    const networkEvent = queue.next();

    if (!worldPopulated) {
      worldPopulated = populateWorld(space, world, staticEntities, dynamicEntities);
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
      });
    }

    if (networkEvent.type === NetworkEvent.UserDisconnected) {
      const { user } = networkEvent;
      deletePlayerEntity(user, space, playerEntities, world);
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
                  message: `${usernameCommand.username} has joined the game`,
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

            // Calculate the exact shot vector direction
            const vectorX = hitX - fromX;
            const vectorY = hitY - fromY;

            // Normalize the vector
            const magnitude = Math.sqrt(vectorX * vectorX + vectorY * vectorY);
            const normalizedX = vectorX / magnitude;
            const normalizedY = vectorY / magnitude;

            // Find the directly hit entity
            const hitEntity = dynamicEntities.get(impactCommand.targetNid);
            //console.log('hitEntity', hitEntity);
            //lagCompensatedHitscanCheck
            //const hitEntity = lagCompensatedHitscanCheck(main, world, fromX, fromY, hitX, hitY, 0.1);

            if (hitEntity && hitEntity.body && hitEntity.body.type !== p2.Body.STATIC) {
              // Calculate relative point vector in world coords (offset from body center)
              const relativePoint: [number, number] = [
                hitX - hitEntity.body.position[0],
                hitY - hitEntity.body.position[1],
              ];

              const force = impactCommand.impactForce;
              hitEntity.body.applyImpulse(
                [normalizedX * force, normalizedY * force],
                relativePoint
              );
              main.addMessage({
                ntype: NetworkType.ServerMessage,
                message: `${hitEntity.nid} was hit by a bullet`,
              });
              // local messages must include x and y for view culling
              space.addMessage({
                ntype: NetworkType.ShotImpactMessage,
                targetNid: hitEntity.nid,
                x: hitX,
                y: hitY,
                fromX: fromX,
                fromY: fromY,
                force: impactCommand.impactForce,
              });
            }
          }
        });
      }
    }
  }

  world.step(worldConfig.worldStepRate);

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
}, 1000 / worldConfig.serverTickRate);
