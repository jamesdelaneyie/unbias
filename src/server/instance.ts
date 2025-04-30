import { Instance, NetworkEvent, AABB2D, ChannelAABB2D, Channel, Binary } from 'nengi';
import { ncontext } from '../common/ncontext';
import { NType } from '../common/NType';
import { playerEntity } from '../server/playerEntity';
import { uWebSocketsInstanceAdapter } from 'nengi-uws-instance-adapter';
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

// users
const playerEntities: Map<number, playerEntity> = new Map();

const world = new p2.World({
  gravity: [0, 0.5],
});

instance.onConnect = async (handshake: any) => {
  console.log('handshake received', handshake.token);
  return true;
};

const createPhysicalObject = (object: any) => {
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

const createPlayerEntity = (user: any, username: Binary.String) => {
  const nextId = Object.entries(playerEntities).length;
  const viewSize = 1100;
  const newUser = new playerEntity(nextId, user, username);
  newUser.x = viewSize / 2;
  newUser.y = viewSize / 2;
  newUser.view = new AABB2D(0, 0, viewSize, viewSize);
  playerEntities.set(newUser.nid, newUser);
  space.addEntity(newUser);
  space.subscribe(user, newUser.view);
  user.queueMessage({ myId: newUser.nid, ntype: NType.IdentityMessage, username: username });
};

const update = () => {
  while (!queue.isEmpty()) {
    const networkEvent = queue.next();

    if (!worldPopulated) {
      populateWorld();
    }

    // handle a user disconnecting
    if (networkEvent.type === NetworkEvent.UserDisconnected) {
      const { user } = networkEvent;
      const playerEntity = playerEntities.get(user.id);
      if (playerEntity) {
        main.removeEntity(playerEntity);
        space.removeEntity(playerEntity);
      }
    }

    // handle a user connecting
    if (networkEvent.type === NetworkEvent.UserConnected) {
      const { user } = networkEvent;
      main.subscribe(user);
    }

    if (networkEvent.type === NetworkEvent.CommandSet) {
      const { user, commands } = networkEvent;
      if (commands.length > 0) {
        commands.forEach((command: any) => {
          if (command.ntype === NType.Command) {
            //console.log('command', command);
          }
          if (command.ntype === NType.UsernameCommand) {
            createPlayerEntity(user, command.username);
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
