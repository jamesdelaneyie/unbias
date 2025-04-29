import { Instance, NetworkEvent, AABB2D, ChannelAABB2D, Channel } from 'nengi';
import { ncontext } from '../common/ncontext';
import { NType } from '../common/NType';
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

const world = new p2.World({
  gravity: [0, 9.82],
});

const ground = new p2.Body({
  mass: 0,
  position: [0, -1],
  angle: 0,
});

const groundShape = new p2.Box({
  width: 10,
  height: 0.2,
});

ground.addShape(groundShape);
world.addBody(ground);

instance.onConnect = async (handshake: any) => {
  console.log('handshake received', handshake.token);
  return true;
};

const queue = instance.queue;

const update = () => {
  while (!queue.isEmpty()) {
    const networkEvent = queue.next();

    // handle a user disconnecting
    if (networkEvent.type === NetworkEvent.UserDisconnected) {
      const { user } = networkEvent;
      console.log('user disconnected', user.id);
    }

    // handle a user connecting
    if (networkEvent.type === NetworkEvent.UserConnected) {
      const { user } = networkEvent;

      // handle connection here... for example:
      main.subscribe(user);
      const viewSize = 2200;
      // @ts-expect-error user view not typed
      user.view = new AABB2D(0, 0, viewSize, viewSize);
      // @ts-expect-error user view not typed
      space.subscribe(networkEvent.user, user.view);

      //generate a random color
      const color = Math.random() * 0xffffff;

      const playerEntity = {
        nid: 0,
        ntype: NType.Entity,
        x: 700,
        y: 400,
        color: color,
        username: 'J',
      };

      main.addEntity(playerEntity);
      space.addEntity(playerEntity);
      user.queueMessage({ myId: playerEntity.nid, ntype: NType.IdentityMessage });

      const objectEntity = {
        nid: 1,
        ntype: NType.Object,
        x: 2,
        y: 1,
        width: 1,
        height: 1,
        shape: 'circle',
        color: color,
      };
      space.addEntity(objectEntity);

      console.log('user connected', playerEntity.nid);
    }

    if (networkEvent.type === NetworkEvent.CommandSet) {
      const { commands } = networkEvent;
      if (commands.length > 0) {
        commands.forEach((command: any) => {
          if (command.ntype === NType.Command) {
            console.log('command', command);
          }
        });
      }
    }

    world.step(1 / 60);
  }
  instance.step();
};

setInterval(() => {
  update();
}, 50);
