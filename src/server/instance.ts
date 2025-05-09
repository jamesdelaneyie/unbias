import { NType } from '../common/NType';
import { ncontext } from '../common/ncontext';
import { Instance, NetworkEvent, ChannelAABB2D, Historian } from 'nengi';
import { uWebSocketsInstanceAdapter } from 'nengi-uws-instance-adapter';
import { Command, MoveCommand, ObjectEntity, UsernameCommand, Entity } from '../common/types';
import { PlayerEntity } from '../common/PlayerEntity';
import {
  createPlayerEntity,
  deletePlayerEntity,
  createPhysicalObject,
} from '../server/EntityManager';
import { applyCommand } from '../common/applyCommand';
import * as p2 from 'p2-es';
import { worldConfig } from '../common/worldConfig';

const instance = new Instance(ncontext);
const uws = new uWebSocketsInstanceAdapter(instance.network, {});
uws.listen(worldConfig.port, () => {
  console.log(`uws adapter is listening on ${worldConfig.port}`);
});

const historian = new Historian(ncontext, 20);
const main = new ChannelAABB2D(instance.localState, historian);

const dynamicEntities: Map<number, Entity> = new Map();
const ObjectEntities: Map<number, ObjectEntity> = new Map();
const playerEntities: Map<number, PlayerEntity> = new Map();

const world = new p2.World({ gravity: [0, -9.82] });

instance.onConnect = async (handshake: any) => {
  console.log('handshake received', handshake.token);
  return true;
};

const queue = instance.queue;
let worldPopulated = false;

const populateWorld = () => {
  const color = 0xffffff;
  const numObjects = 120;
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
      mass: 1,
      bodyType: p2.Body.DYNAMIC,
      renderTarget: { x: 0, y: 0, rotation: 0 },
    };

    const objectBody = createPhysicalObject(object);
    object.body = objectBody;
    ObjectEntities.set(object.nid, object);
    world.addBody(object.body);
    main.addEntity(object);
  }

  const leftWall: ObjectEntity = {
    ntype: NType.Object,
    nid: 500,
    x: -8,
    y: 0,
    width: 1,
    height: 20,
    shape: 'circle',
    color: color,
    rotation: 0,
    body: null as unknown as p2.Body,
    mass: 0,
    bodyType: p2.Body.STATIC,
    renderTarget: { x: 0, y: 0, rotation: 0 },
  };

  const leftWallBody = createPhysicalObject(leftWall);
  leftWall.body = leftWallBody;
  ObjectEntities.set(leftWall.nid, leftWall);
  world.addBody(leftWall.body);
  main.addEntity(leftWall);

  const rightWall: ObjectEntity = {
    ntype: NType.Object,
    nid: 501,
    x: 8,
    y: 0,
    width: 1,
    height: 20,
    shape: 'circle',
    color: color,
    rotation: 0,
    body: null as unknown as p2.Body,
    mass: 0,
    bodyType: p2.Body.STATIC,
    renderTarget: { x: 0, y: 0, rotation: 0 },
  };

  const rightWallBody = createPhysicalObject(rightWall);
  rightWall.body = rightWallBody;
  ObjectEntities.set(rightWall.nid, rightWall);
  world.addBody(rightWall.body);
  main.addEntity(rightWall);

  const topWall: ObjectEntity = {
    ntype: NType.Object,
    nid: 503,
    x: 0,
    y: 12,
    width: 16,
    height: 1,
    shape: 'circle',
    color: color,
    rotation: 0,
    body: null as unknown as p2.Body,
    mass: 0,
    bodyType: p2.Body.STATIC,
    renderTarget: { x: 0, y: 0, rotation: 0 },
  };

  const topWallBody = createPhysicalObject(topWall);
  topWall.body = topWallBody;
  ObjectEntities.set(topWall.nid, topWall);
  world.addBody(topWall.body);
  main.addEntity(topWall);

  const bottomWall: ObjectEntity = {
    ntype: NType.Object,
    nid: 504,
    x: 0,
    y: -8,
    width: 16,
    height: 1,
    shape: 'circle',
    color: color,
    rotation: 0,
    body: null as unknown as p2.Body,
    mass: 0,
    bodyType: p2.Body.STATIC,
    renderTarget: { x: 0, y: 0, rotation: 0 },
  };

  const bottomWallBody = createPhysicalObject(bottomWall);
  bottomWall.body = bottomWallBody;
  ObjectEntities.set(bottomWall.nid, bottomWall);
  world.addBody(bottomWall.body);
  main.addEntity(bottomWall);

  worldPopulated = true;
};

const update = () => {
  while (!queue.isEmpty()) {
    const networkEvent = queue.next();

    if (!worldPopulated) {
      populateWorld();
    }

    if (networkEvent.type === NetworkEvent.UserConnected) {
      //const { user } = networkEvent;
      //console.log('user connected', user);
    }

    if (networkEvent.type === NetworkEvent.UserDisconnected) {
      const { user } = networkEvent;
      deletePlayerEntity(user, main, playerEntities);
    }

    if (networkEvent.type === NetworkEvent.CommandSet) {
      const { user, commands } = networkEvent;
      if (commands.length > 0) {
        commands.forEach((command: Command) => {
          if (command.ntype === NType.MoveCommand) {
            const player = playerEntities.get(command.nid);
            //console.log(command);
            if (player) {
              //console.log('move command received', command);
              applyCommand(player, command as MoveCommand);
            }
          }
          // @ts-ignore
          if (command.ntype === NType.UsernameCommand) {
            const usernameCommand = command as UsernameCommand;
            const usernameTaken = Array.from(playerEntities.values()).find(
              entity => entity.username === usernameCommand.username
            );
            if (usernameTaken) {
              console.log('Username already taken');
              return;
            }
            try {
              const player = createPlayerEntity(user, usernameCommand);
              if (player) {
                main.subscribe(user, player.view);
                main.addEntity(player);
                world.addBody(player.body);
                playerEntities.set(player.nid, player);
                dynamicEntities.set(player.nid, player);
                console.log('player created', player?.username);
                user.queueMessage({
                  myId: player.nid,
                  ntype: NType.IdentityMessage,
                  username: usernameCommand.username,
                });
              }
            } catch (error) {
              console.error('Error creating player entity', error);
            }
          }
        });
      }
    }
  }

  world.step(1 / worldConfig.serverTickRate);

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
    object.x = object.body?.position[0];
    object.y = object.body?.position[1];
    object.rotation = object.body?.angle;
  });

  instance.step();
};

setInterval(() => {
  update();
}, 50);
