import { Client, IEntity, Interpolator } from 'nengi';
import { ncontext } from '../common/ncontext';
import { WsClientAdapter } from 'nengi-ws-client-adapter';
import { NetworkType } from '../common/NetworkType';
import { IEntityFrame } from 'nengi/build/client/Frame';

type Bot = {
  nid: number;
  client: Client;
  interpolator: Interpolator;
  isAlive: boolean;
  x: number;
  y: number;
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
  const client = new Client(ncontext, WsClientAdapter, 20);
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
    rotation: 0,
    mouseX: 0,
    mouseY: 0,
  });
}

async function connectBots(quantity: number) {
  for (let i = 0; i < quantity; i++) {
    // we don't await this even though it is async
    // this allows multiple connections to be opened in parallel
    // add await to open them one at a time
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
      if (Math.random() > 0.99) {
        const noseLength = 100;
        const noseTipX = bot.x + Math.cos(bot.controls.rotation) * noseLength;
        const noseTipY = bot.y + Math.sin(bot.controls.rotation) * noseLength;
        bot.mouseX = bot.x + Math.cos(bot.controls.rotation) * 1000;
        bot.mouseY = bot.y + Math.sin(bot.controls.rotation) * 1000;
        //console.log('bot shot', bot.mouseX, bot.mouseY);
        //console.log('bot nose', noseTipX, noseTipY);
        bot.client.addCommand({
          ntype: NetworkType.ShotImpactCommand,
          targetNid: 0,
          fromX: noseTipX,
          fromY: noseTipY,
          hitX: bot.mouseX,
          hitY: bot.mouseY,
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

connectBots(5);
