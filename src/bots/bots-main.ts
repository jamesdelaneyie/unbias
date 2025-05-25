import { Client, IEntity, Interpolator } from 'nengi';
import { networkContext } from '../common/networkContext';
import { WsClientAdapter } from 'nengi-ws-client-adapter';
import { NetworkType } from '../common/NetworkType';
import { IEntityFrame } from 'nengi/build/client/Frame';
import { config } from '../common/config';

type Bot = {
  nid: number;
  client: Client;
  interpolator: Interpolator;
  isAlive: boolean;
  x: number;
  y: number;
  size: number;
  rotation: number;
  mouseX: number;
  mouseY: number;
  controls: {
    w: boolean;
    a: boolean;
    s: boolean;
    d: boolean;
    space: boolean;
    rotation: number;
  };
};

const bots: Set<Bot> = new Set();

async function createBot() {
  const client = new Client(networkContext, WsClientAdapter, 20);
  // we use an interpolator for the bots because as of nengi alpha.150
  // this is the only thing that clears the network data
  // otherwise the client will just hoard it until it crashes
  const interpolator = new Interpolator(client);
  const protocol = 'ws:';
  const host = 'localhost';
  const port = 9001;
  const wsUrl = `${protocol}//${host}:${port}/`;
  await client.connect(wsUrl, { token: 12345 });
  const username = Array.from({ length: 3 }, () =>
    String.fromCharCode(65 + Math.floor(Math.random() * 26))
  ).join('');
  client.addCommand({
    ntype: NetworkType.UsernameCommand,
    username: username,
  });
  console.log('bot created');
  const controls = {
    w: false,
    a: false,
    s: false,
    d: false,
    space: false,
    rotation: 0,
  };
  bots.add({
    client,
    interpolator,
    controls,
    nid: 0,
    isAlive: true,
    x: 0,
    y: 0,
    size: config.playerSize,
    rotation: 0,
    mouseX: 0,
    mouseY: 0,
  });
}

async function connectBots(quantity: number) {
  for (let i = 0; i < quantity; i++) {
    createBot();
  }
}

setInterval(
  () => {
    bots.forEach(bot => {
      if (!bot.isAlive) {
        return;
      }

      const istate = bot.interpolator.getInterpolatedState(100);

      while (bot.client.network.messages.length > 0) {
        const message = bot.client.network.messages.pop();
        if (message.ntype === NetworkType.IdentityMessage) {
          bot.nid = message.myId;
          console.log(bot.nid);
        }
      }

      istate.forEach((snapshot: IEntityFrame) => {
        snapshot.updateEntities.forEach((entity: IEntity) => {
          if (entity.nid === bot.nid) {
            if (entity.prop === 'x') {
              bot.x = entity.value;
            }
            if (entity.prop === 'y') {
              bot.y = entity.value;
            }
            if (entity.prop === 'rotation') {
              bot.rotation = entity.value;
            }
            if (entity.prop === 'isAlive') {
              console.log('bot is alive', entity.value);
              bot.isAlive = entity.value;
            }
          }
        });
        snapshot.deleteEntities.forEach((nid: number) => {
          if (nid === bot.nid) {
            console.log('bot died');
            bot.isAlive = false;
          }
        });
      });

      if (Math.random() > 0.95) {
        bot.controls.w = Math.random() > 0.5;
        bot.controls.a = Math.random() > 0.5;
        bot.controls.s = Math.random() > 0.5;
        bot.controls.d = Math.random() > 0.5;
        bot.controls.space = Math.random() > 0.5;
        bot.controls.rotation = Math.random() * 2 * Math.PI;
      }
      if (Math.random() > 0.95 && bot.client.network.clientTick > 200) {
        // Calculate nose tip position (where shot originates from)
        const noseLength = bot.size * 0.8666; // Small offset from center
        const noseTipX = bot.x + Math.cos(bot.controls.rotation) * noseLength;
        const noseTipY = bot.y + Math.sin(bot.controls.rotation) * noseLength;

        // Calculate target point 500 units away along same angle
        const targetDistance = 500;
        const targetX = bot.x + Math.cos(bot.controls.rotation) * targetDistance;
        const targetY = bot.y + Math.sin(bot.controls.rotation) * targetDistance;

        bot.client.addCommand({
          ntype: NetworkType.ShotImpactCommand,
          originNid: bot.nid,
          targetNid: 0,
          fromX: noseTipX,
          fromY: noseTipY,
          hitX: targetX,
          hitY: targetY,
          impactForce: 200,
        });
      }
      bot.client.addCommand({
        ntype: NetworkType.MoveCommand,
        nid: bot.nid,
        w: bot.controls.w,
        a: bot.controls.a,
        s: bot.controls.s,
        d: bot.controls.d,
        space: bot.controls.space,
        rotation: bot.controls.rotation,
      });

      bot.client.flush();
    });
  },
  (1 / 30) * 1000
);

connectBots(10);
