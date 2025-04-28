import { Client, Interpolator } from 'nengi';
import { Application, Container, Graphics } from 'pixi.js';
import TaggedTextPlus from 'pixi-tagged-text-plus';
import { ncontext } from '@/common/ncontext';
import { NType } from '@/common/NType';
import { WebSocketClientAdapter } from 'nengi-websocket-client-adapter';
import { createNotificationBox, addNotification } from './htmlUI';
import * as p2 from 'p2-es';

type EntityMap = Map<number, Container>;
let entities: EntityMap = new Map();
let reconnectTimeout: number | null = null;

const ligtenColor = (color: number, amount: number) => {
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;

  const newR = Math.min(255, r + (255 - r) * amount);
  const newG = Math.min(255, g + (255 - g) * amount);
  const newB = Math.min(255, b + (255 - b) * amount);

  return (newR << 16) + (newG << 8) + newB;
};

const createPlayer = (entity: any, app: Application, entities: EntityMap) => {
  const playerSize = 30;
  const fontSize = playerSize / 1.5;
  const playerContainer = new Container();
  const playerBody = new Graphics()
    .circle(0, 0, playerSize / 2)
    .fill({ color: entity.color, alpha: 1 })
    .stroke({ color: ligtenColor(entity.color, 0.2), width: 1 });
  playerContainer.x = entity.x;
  playerContainer.y = entity.y;
  const username = new TaggedTextPlus(
    entity.username,
    {
      default: {
        fontSize: fontSize,
        fill: '#fff',
        align: 'center',
        wordWrap: true,
        wordWrapWidth: 2,
        stroke: {
          color: '#000',
          width: 0,
        },
      },
    },
    { skipUpdates: true }
  );
  username.x = 0;
  username.y = 0;
  username.position.set(-1.5, -fontSize / 2);
  username.width = playerSize;
  username.height = playerSize;
  username.update();
  playerContainer.addChild(playerBody);
  playerContainer.addChild(username);
  app.stage.addChild(playerContainer);
  entities.set(entity.nid, playerContainer);
};

const updatePlayer = (entity: any, app: Application, entities: EntityMap) => {
  const player = entities.get(entity.nid);
  if (player) {
    player.x = entity.x;
    player.y = entity.y;
  }
};

const deletePlayer = (entity: any, app: Application, entities: EntityMap) => {
  const player = entities.get(entity.nid);
  if (player) {
    player.destroy();
    entities.delete(entity.nid);
  }
};

const drawBasicText = (
  app: Application,
  masterContainer: Container,
  text: string,
  x: number,
  y: number
) => {
  const taggedText = new TaggedTextPlus(text, {
    default: {
      fontSize: '24px',
      fill: '#fff',
      align: 'left',
    },
  });
  taggedText.x = x;
  taggedText.y = y;
  masterContainer.addChild(taggedText);
};

const drawInitialUI = (app: Application, masterContainer: Container) => {
  drawBasicText(app, masterContainer, 'BIAS 2.0', 10, 10);
};

const cleanup = () => {
  entities.forEach(player => player.destroy());
  entities.clear();
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
  }
};

window.addEventListener('load', async () => {
  // initialize the pixi app
  const app = new Application();
  await app.init({
    antialias: true,
    background: '#000000',
    resolution: window.devicePixelRatio,
    autoDensity: true,
    resizeTo: window,
  });
  document.body.appendChild(app.canvas);

  const masterContainer = new Container();
  masterContainer.zIndex = 1000;
  app.stage.addChild(masterContainer);

  drawInitialUI(app, masterContainer);

  const worldContainer = new Container();
  worldContainer.width = app.screen.width;
  worldContainer.height = app.screen.height;
  worldContainer.scale.y = -1;
  worldContainer.zIndex = 1200;
  app.stage.addChild(worldContainer);

  const world = new p2.World({
    gravity: [0, -9.82],
  });

  const ground = new p2.Body({
    mass: 0,
    position: [0, 0],
  });

  const groundShape = new p2.Box({
    width: 1000,
    height: 20,
  });

  const groundGraphics = new Graphics();
  groundGraphics.rect(0, -200, app.screen.width, 5);
  groundGraphics.fill({ color: 0xffffff, alpha: 1 });
  worldContainer.addChild(groundGraphics);

  ground.addShape(groundShape);
  world.addBody(ground);

  const circle = new p2.Body({
    mass: 1,
    position: [100, 100],
    angularVelocity: 0,
  });

  const circleShape = new p2.Circle({
    radius: 10,
  });

  circle.addShape(circleShape);
  world.addBody(circle);

  const circleGraphics = new Graphics();
  circleGraphics.circle(700, -200, 10);
  circleGraphics.fill({ color: 0xffffff, alpha: 1 });
  worldContainer.addChild(circleGraphics);

  let connected = false;
  const serverTickRatePerSecond = 20;
  const client = new Client(ncontext, WebSocketClientAdapter, serverTickRatePerSecond);

  // Reconnection settings
  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_DELAY = 2000; // 2 seconds
  let reconnectAttempts = 0;
  let reconnectTimeout: number | null = null;

  const attemptReconnect = async () => {
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      addNotification(document, notificationBox, 'Max reconnection attempts reached');
      return;
    }

    reconnectAttempts++;
    addNotification(
      document,
      notificationBox,
      `Attempting to reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`
    );

    try {
      const res = await client.connect('ws://localhost:9001', { token: 12345 });
      if (res === 'accepted') {
        addNotification(document, notificationBox, 'Reconnected to server');
        connected = true;
        reconnectAttempts = 0;
        if (reconnectTimeout) {
          clearTimeout(reconnectTimeout);
          reconnectTimeout = null;
        }
      } else {
        console.log(res);
        addNotification(document, notificationBox, 'Reconnection failed: ' + res);
        scheduleReconnect();
      }
    } catch (err) {
      console.log('empty err', err);
      addNotification(document, notificationBox, 'Reconnection error');
      scheduleReconnect();
    }
  };

  const scheduleReconnect = () => {
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
    }
    reconnectTimeout = window.setTimeout(attemptReconnect, RECONNECT_DELAY);
  };

  client.setDisconnectHandler((reason: any, event: any) => {
    console.warn('Disconnected custom!', reason, event);
    addNotification(document, notificationBox, 'Disconnected from server');
    connected = false;
    scheduleReconnect();
    cleanup();
  });
  const interpolator = new Interpolator(client);

  const notificationBox = createNotificationBox(document);
  addNotification(document, notificationBox, 'Window loaded');

  const keys: Record<'w' | 'a' | 's' | 'd', boolean> = {
    w: false,
    a: false,
    s: false,
    d: false,
  };

  window.addEventListener('keydown', e => {
    if (e.key in keys) {
      keys[e.key as keyof typeof keys] = true;
    }
  });

  window.addEventListener('keyup', e => {
    if (e.key in keys) {
      keys[e.key as keyof typeof keys] = false;
    }
  });

  try {
    const res = await client.connect('ws://localhost:9001', { token: 12345 });
    if (res === 'accepted') {
      addNotification(document, notificationBox, 'Connected to server');
      connected = true;
    } else {
      console.log(res);
      addNotification(document, notificationBox, 'Connection error: ' + res);
    }
  } catch (err) {
    console.log(err);
    addNotification(document, notificationBox, 'Connection error: ' + err);
    return;
  }

  const tick = (delta: number) => {
    if (!connected) {
      return;
    }

    world.step(1 / 60, delta, 3);

    circleGraphics.position.x = circle.position[0];
    circleGraphics.position.y = circle.position[1];
    circleGraphics.rotation = circle.angle;

    groundGraphics.position.x = ground.position[0];
    groundGraphics.position.y = -ground.position[1];

    const istate = interpolator.getInterpolatedState(100);

    while (client.network.messages.length > 0) {
      const message = client.network.messages.pop();
      console.log('Received message:', message);
    }

    istate.forEach(snapshot => {
      snapshot.createEntities.forEach((entity: any) => {
        console.log('createEntities', entity);
        createPlayer(entity, app, entities);
      });

      snapshot.updateEntities.forEach((diff: any) => {
        updatePlayer(diff, app, entities);
      });

      snapshot.deleteEntities.forEach((nid: number) => {
        deletePlayer(nid, app, entities);
      });
    });

    if (keys.w || keys.a || keys.s || keys.d) {
      addNotification(
        document,
        notificationBox,
        'Sending command ' + keys.w + keys.a + keys.s + keys.d
      );
      client.addCommand({
        ntype: NType.Command,
        w: keys.w,
        a: keys.a,
        s: keys.s,
        d: keys.d,
        delta,
      });
    }

    client.flush();

    // Update ground graphics position
    groundGraphics.position.x = ground.position[0];
    groundGraphics.position.y = -ground.position[1];
  };

  // a standard rAF loop
  let prev = performance.now();
  const loop = () => {
    window.requestAnimationFrame(loop);
    const now = performance.now();
    const delta = (now - prev) / 1000;
    prev = now;
    // probably missing "if (connected)..."
    tick(delta);
  };

  // start the loop
  loop();
});
