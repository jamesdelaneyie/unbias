import { Client, Interpolator } from 'nengi';
import { ncontext } from '../common/ncontext';
import { WsClientAdapter } from 'nengi-ws-client-adapter';
import { NetworkType } from '../common/NetworkType';

type Bot = {
  nid: number;
  client: Client;
  interpolator: Interpolator;
  controls: { w: boolean; a: boolean; s: boolean; d: boolean; space: boolean; rotation: number };
};

const bots: Set<Bot> = new Set();

async function createBot() {
  const client = new Client(ncontext, WsClientAdapter, 20);
  // we use an interpolator for the bots because as of nengi alpha.150
  // this is the only thing that clears the network data
  // otherwise the client will just hoard it until it crashes
  const interpolator = new Interpolator(client);
  await client.connect('ws://localhost:9001', { token: 12345 });
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
  bots.add({ client, interpolator, controls, nid: 0 });
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
      bot.interpolator.getInterpolatedState(100);

      while (bot.client.network.messages.length > 0) {
        const message = bot.client.network.messages.pop();
        console.log('Received message:', message);
        if (message.ntype === NetworkType.IdentityMessage) {
          console.log('IdentityMessage', message);
          bot.nid = message.myId;
          console.log(bot.nid);
        }
      }

      if (Math.random() > 0.95) {
        bot.controls.w = Math.random() > 0.5;
        bot.controls.a = Math.random() > 0.5;
        bot.controls.s = Math.random() > 0.5;
        bot.controls.d = Math.random() > 0.5;
        bot.controls.space = Math.random() > 0.5;
        bot.controls.rotation = Math.random() * 2 * Math.PI;
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

connectBots(50);
