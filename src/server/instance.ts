import { Instance, NetworkEvent, AABB2D, ChannelAABB2D, Channel } from 'nengi';
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

const createPlayerEntity = (user: any, username: string) => {
  try {
    const viewSize = 1100;
    const newUser = new playerEntity(user, username);
    newUser.x = viewSize / 2 + Math.random() * 200;
    newUser.y = viewSize / 2;
    // creates a local view for the playerEntity for culling
    newUser.view = new AABB2D(0, 0, viewSize, viewSize);
    space.subscribe(user, newUser.view);
    space.addEntity(newUser); // assigns an nid to the playerEntity
    playerEntities.set(newUser.nid, newUser);
    user.queueMessage({ myId: newUser.nid, ntype: NType.IdentityMessage, username: username });
  } catch (error) {
    console.error('Error creating player entity', error);
  }
};

const deletePlayerEntity = (user: any) => {
  try {
    const playerEntity = Array.from(playerEntities.values()).find(entity => entity.id === user.id);
    if (playerEntity) {
      const nId = playerEntity.nid;
      main.unsubscribe(user);
      space.unsubscribe(user);
      main.removeEntity(playerEntity);
      space.removeEntity(playerEntity);
      playerEntities.delete(nId);
    }
  } catch (error) {
    console.error('Error deleting player entity', error);
  }
};

const update = () => {
  while (!queue.isEmpty()) {
    const networkEvent = queue.next();

    if (!worldPopulated) {
      populateWorld();
    }

    // handle a user connecting
    if (networkEvent.type === NetworkEvent.UserConnected) {
      const { user } = networkEvent;
      main.subscribe(user);
    }

    // handle a user disconnecting
    if (networkEvent.type === NetworkEvent.UserDisconnected) {
      const { user } = networkEvent;
      deletePlayerEntity(user);
    }

    if (networkEvent.type === NetworkEvent.CommandSet) {
      const { user, commands } = networkEvent;
      if (commands.length > 0) {
        commands.forEach((command: any) => {
          if (command.ntype === NType.Command) {
            //console.log('command', command);
          }
          if (command.ntype === NType.UsernameCommand) {
            const usernameTaken = Array.from(playerEntities.values()).find(
              entity => entity.username === command.username
            );
            if (usernameTaken) {
              console.log('Username already taken');
              return;
            }
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
