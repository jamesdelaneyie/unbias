import { NType } from '../common/NType';
import { ncontext } from '../common/ncontext';
import { Instance, NetworkEvent, ChannelAABB2D, Channel } from 'nengi';
import { uWebSocketsInstanceAdapter } from 'nengi-uws-instance-adapter';
import { Command, MoveCommand, ObjectEntity, UsernameCommand } from '../common/types';
import { PlayerEntity } from '../common/PlayerEntity';
import {
  createPlayerEntity,
  deletePlayerEntity,
  createPhysicalObject,
} from '../server/EntityManager';
import { applyCommand } from '../common/applyCommand';
import * as p2 from 'p2-es';
import { worldConfig } from '../common/worldConfig';

const port = worldConfig.port;
const instance = new Instance(ncontext);
const uws = new uWebSocketsInstanceAdapter(instance.network, {});
uws.listen(port, () => {
  console.log(`uws adapter is listening on ${port}`);
});

const main = new Channel(instance.localState);
const space = new ChannelAABB2D(instance.localState);

const ObjectEntities: Map<number, ObjectEntity> = new Map();
const playerEntities: Map<number, PlayerEntity> = new Map();

const world = new p2.World({ gravity: [0, 0] });

instance.onConnect = async (handshake: any) => {
  console.log('handshake received', handshake.token);
  return true;
};

const queue = instance.queue;
let worldPopulated = false;

const populateWorld = () => {
  const color = 0xffffff;
  const numObjects = 60;
  const gridSize = 4;

  for (let i = 0; i < numObjects; i++) {
    // Random position within 4x4 grid
    const x = Math.floor(Math.random() * gridSize) + 0.5;
    const y = Math.floor(Math.random() * gridSize) + 0.5;

    const object: ObjectEntity = {
      nid: i + 1,
      ntype: NType.Object,
      x: x,
      y: y,
      width: 1,
      height: 1,
      shape: 'circle',
      color: color,
      rotation: 0,
      body: null as unknown as p2.Body,
      renderTarget: { x: 0, y: 0, rotation: 0 },
    };

    const objectBody = createPhysicalObject(object);
    object.body = objectBody;
    ObjectEntities.set(object.nid, object);
    world.addBody(object.body);
  }

  ObjectEntities.forEach((obj: ObjectEntity) => {
    space.addEntity(obj);
  });
  worldPopulated = true;
};

const update = () => {
  while (!queue.isEmpty()) {
    const networkEvent = queue.next();

    if (!worldPopulated) {
      populateWorld();
    }

    if (networkEvent.type === NetworkEvent.UserConnected) {
      const { user } = networkEvent;
      main.subscribe(user);
    }

    if (networkEvent.type === NetworkEvent.UserDisconnected) {
      const { user } = networkEvent;
      deletePlayerEntity(user, space, main, playerEntities);
    }

    if (networkEvent.type === NetworkEvent.CommandSet) {
      const { user, commands } = networkEvent;
      if (commands.length > 0) {
        commands.forEach((command: Command) => {
          if (command.ntype === NType.MoveCommand) {
            const player = playerEntities.get(command.nid);
            if (player) {
              applyCommand(player, command as MoveCommand);
            }
          }
          // @ts-ignore
          if (command.ntype === NType.UsernameCommand) {
            const usernameTaken = Array.from(playerEntities.values()).find(
              // @ts-ignore
              entity => entity.username === command.username
            );
            if (usernameTaken) {
              console.log('Username already taken');
              return;
            }
            const player = createPlayerEntity(
              user,
              command as UsernameCommand,
              space,
              playerEntities
            );
            if (player?.body) {
              world.addBody(player.body);
            }
          }
        });
      }
    }
  }

  world.step(1 / 60);

  // Check for collisions between players and objects
  world.on('beginContact', event => {
    const bodyA = event.bodyA;
    const bodyB = event.bodyB;

    // Find the player and object involved in collision
    let playerEntity = null;
    let objectEntity = null;

    // Check if bodyA is a player and bodyB is an object
    const playerA = Array.from(playerEntities.values()).find(p => p.body === bodyA);
    const objectB = Array.from(ObjectEntities.values()).find(o => o.body === bodyB);
    if (playerA && objectB) {
      playerEntity = playerA;
      objectEntity = objectB;
    }

    // Check if bodyB is a player and bodyA is an object
    const playerB = Array.from(playerEntities.values()).find(p => p.body === bodyB);
    const objectA = Array.from(ObjectEntities.values()).find(o => o.body === bodyA);
    if (playerB && objectA) {
      playerEntity = playerB;
      objectEntity = objectA;
    }

    // Update object color when player touches it
    if (playerEntity && objectEntity) {
      objectEntity.color = playerEntity.color;
    }
  });

  // update the positions of the player entities
  playerEntities.forEach(player => {
    player.x = player.body?.position[0];
    player.y = player.body?.position[1];
    player.rotation = player.body?.angle;
  });

  // update the positions of the object entities
  ObjectEntities.forEach(object => {
    // @ts-ignore for the moment
    object.x = object.body?.position[0];
    // @ts-ignore for the moment
    object.y = object.body?.position[1];
    // @ts-ignore for the moment
    object.rotation = object.body?.angle;
  });

  instance.step();
};

setInterval(() => {
  update();
}, 50);
