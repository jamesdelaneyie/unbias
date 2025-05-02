import { NType } from '../common/NType';
import { ncontext } from '../common/ncontext';
import { Instance, NetworkEvent, ChannelAABB2D, Channel } from 'nengi';
import { uWebSocketsInstanceAdapter } from 'nengi-uws-instance-adapter';
import { Command, ObjectEntity, MoveCommand, UsernameCommand } from '../common/types';
import { PlayerEntity } from '../server/PlayerEntity';
import { createPlayerEntity, deletePlayerEntity } from '../server/EntityManager';
import { applyCommand } from '../common/applyCommand';
import * as p2 from 'p2-es';

const port = 9001;
const instance = new Instance(ncontext);
const uws = new uWebSocketsInstanceAdapter(instance.network, {});
uws.listen(port, () => {
  console.log(`uws adapter is listening on ${port}`);
});

const main = new Channel(instance.localState);
const space = new ChannelAABB2D(instance.localState);

// dynamic objects react to p2 world gravity
// and other entities in the p2 world
// networked across clients by nengi
type dynamicObject = {
  entity: {
    nid: number;
    ntype: NType;
    x: number;
    y: number;
    width: number;
    height: number;
    shape: String;
    color: number;
  };
  body: p2.Body;
};
const dynamicObjects: Map<number, dynamicObject> = new Map();
const playerEntities: Map<number, PlayerEntity> = new Map();

const world = new p2.World({
  gravity: [0, 0.5],
});

instance.onConnect = async (handshake: any) => {
  console.log('handshake received', handshake.token);
  return true;
};

const createPhysicalObject = (object: ObjectEntity) => {
  const body = new p2.Body({
    mass: 1,
    position: [object.x, object.y],
    angle: 0,
    angularVelocity: 0.5,
  });

  const shape = new p2.Circle({
    radius: object.width,
  });

  body.addShape(shape);
  world.addBody(body);

  return body;
};

const queue = instance.queue;
let worldPopulated = false;

const populateWorld = () => {
  const color = 0xffffff;
  const objectEntity = {
    nid: 1,
    ntype: NType.Object,
    x: 1,
    y: 1,
    width: 1,
    height: 1,
    shape: 'circle',
    color: color,
    rotation: 0,
  };
  const objectBody = createPhysicalObject(objectEntity);
  dynamicObjects.set(objectEntity.nid, { entity: objectEntity, body: objectBody });
  space.addEntity(objectEntity);
  worldPopulated = true;

  // add all the world objects to 2d space
  dynamicObjects.forEach(obj => {
    space.addEntity(obj.entity);
  });
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
          if (command.ntype === NType.Command) {
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
            createPlayerEntity(user, command as UsernameCommand, space, playerEntities);
          }
        });
      }
    }

    dynamicObjects.forEach(object => {
      object.entity.x = object.body.position[0];
      object.entity.y = object.body.position[1];
    });

    world.step(1 / 60);
  }
  instance.step();
};

setInterval(() => {
  update();
}, 50);
