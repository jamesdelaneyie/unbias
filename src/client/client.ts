import { Client, Interpolator } from 'nengi';
import { NType } from '@/common/NType';
import { ncontext } from '@/common/ncontext';
import { WebSocketClientAdapter } from 'nengi-websocket-client-adapter';
import { Application, Container, Graphics } from 'pixi.js';
import TaggedTextPlus from 'pixi-tagged-text-plus';
import { createNotificationBox, addNotification, ligtenColor } from './UIUtils';

type EntityMap = Map<number, Container>;
let entities: EntityMap = new Map();
let reconnectTimeout: number | null = null;

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

const createObject = (object: any, worldContainer: Container, entities: EntityMap) => {
  const objectContainer = new Graphics()
    .circle(0, 0, object.width / 2)
    .fill({ color: object.color, alpha: 1 })
    .stroke({ color: ligtenColor(object.color, 0.2), width: 1 });
  objectContainer.x = object.x;
  objectContainer.y = object.y;
  worldContainer.addChild(objectContainer);
  entities.set(object.nid, objectContainer);
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
  const app = new Application(); // pixi.js app
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
  worldContainer.position.x = app.screen.width / 2;
  worldContainer.position.y = app.screen.height / 2;
  worldContainer.scale.x = 100;
  worldContainer.scale.y = -100;
  app.stage.addChild(worldContainer);

  const worldContainerGraphics = new Graphics();
  worldContainerGraphics.rect(
    -app.screen.width / 2,
    -app.screen.height / 2,
    app.screen.width,
    app.screen.height
  );
  worldContainerGraphics.fill({ color: 0xffffff, alpha: 0.1 });
  worldContainer.addChild(worldContainerGraphics);

  /*const groundGraphics = new Graphics();
  groundGraphics.rect(-5, -0.1, 10, 0.2);
  groundGraphics.fill({ color: 0xffffff, alpha: 1 });
  worldContainer.addChild(groundGraphics);

  const textureRadius = 100;
  const circleGraphics = new Graphics();
  circleGraphics.circle(textureRadius, textureRadius, textureRadius);
  circleGraphics.fill({ color: 0xffffff, alpha: 1 });
  const circleTexture = app.renderer.generateTexture(circleGraphics);

  const circleSprite = new Sprite(circleTexture);
  circleSprite.anchor.set(0.5);
  circleSprite.width = 1.0;
  circleSprite.height = 1.0;
  worldContainer.addChild(circleSprite);*/

  app.renderer.resolution = window.devicePixelRatio;

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

    const istate = interpolator.getInterpolatedState(100);

    while (client.network.messages.length > 0) {
      const message = client.network.messages.pop();
      console.log('Received message:', message);
    }

    istate.forEach(snapshot => {
      snapshot.createEntities.forEach((entity: any) => {
        if (entity.ntype === NType.Entity) {
          createPlayer(entity, app, entities);
        } else if (entity.ntype === NType.Object) {
          console.log('createObject', entity);
          createObject(entity, worldContainer, entities);
        }
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
