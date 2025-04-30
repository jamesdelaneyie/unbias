import { Client, Interpolator } from 'nengi';
import { NType } from '@/common/NType';
import { ncontext } from '@/common/ncontext';
import { WebSocketClientAdapter } from 'nengi-websocket-client-adapter';
import { Application, Container, Graphics, Sprite } from 'pixi.js';
import TaggedTextPlus from 'pixi-tagged-text-plus';
import { createNotificationBox, addNotification, addUsernameField } from './UIUtils';
import { createPlayerGraphics, createObjectGraphics } from './worldGraphicsUtils';

type EntityMap = Map<number, Container>;
let entities: EntityMap = new Map();
let reconnectTimeout: number | null = null;

const updatePlayer = (entity: any, entities: EntityMap) => {
  const player = entities.get(entity.nid);
  if (player) {
    player.x = entity.x;
    player.y = entity.y;
  }
};

const updateObject = (entity: any, entities: EntityMap) => {
  const object = entities.get(entity.nid) as Sprite;
  if (object) {
    const property = entity.prop;
    const value = entity.value;
    if (property === 'x') {
      object.position.set(value, object.position.y);
    }
    if (property === 'y') {
      object.position.set(object.position.x, value);
    }
  }
};

const deletePlayer = (entity: any, entities: EntityMap) => {
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
  const app = new Application(); // pixi app
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

  const notificationBox = createNotificationBox(document);

  let connectedToServer = false;
  let connectingToSpace = false;
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
        connectedToServer = true;
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
    connectedToServer = false;
    scheduleReconnect();
    cleanup();
  });

  const interpolator = new Interpolator(client);

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

  addNotification(document, notificationBox, 'local app loaded');

  const existingUsername = localStorage.getItem('username') || '';

  try {
    const res = await client.connect('ws://localhost:9001', {
      token: 12345,
      username: existingUsername,
    });
    if (res === 'accepted') {
      addNotification(document, notificationBox, 'Connected to server');
      connectedToServer = true;
      const usernameField = addUsernameField(document, notificationBox);
      usernameField.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          const username = (e.target as HTMLInputElement).value.trim() as string;
          client.addCommand({
            ntype: NType.UsernameCommand,
            username,
          });
          connectingToSpace = true;
        }
      });
    } else {
      console.log(res);
      addNotification(document, notificationBox, 'Connection error: ' + res);
      attemptReconnect();
    }
  } catch (err) {
    console.log(err);
    addNotification(document, notificationBox, 'Connection error: ' + err);
    attemptReconnect();
    return;
  }

  const tick = (delta: number) => {
    const istate = interpolator.getInterpolatedState(100);

    while (client.network.messages.length > 0) {
      const message = client.network.messages.pop();
      console.log('Received message:', message);
      if (message.ntype === NType.IdentityMessage) {
        if (connectingToSpace) {
          connectingToSpace = false;
          localStorage.setItem('username', message.username);
        }
      }
    }

    istate.forEach(snapshot => {
      snapshot.createEntities.forEach((entity: any) => {
        if (entity.ntype === NType.Entity) {
          createPlayerGraphics(entity, app, entities);
        }
        if (entity.ntype === NType.Object) {
          console.log('createObjectGraphics', entity);
          createObjectGraphics(app, entity, worldContainer, entities);
        }
      });

      snapshot.updateEntities.forEach((diff: any) => {
        updatePlayer(diff, entities);
        updateObject(diff, entities);
      });

      snapshot.deleteEntities.forEach((nid: number) => {
        deletePlayer(nid, entities);
      });
    });

    if (keys.w || keys.a || keys.s || keys.d) {
      /*addNotification(
        document,
        notificationBox,
        'Sending command ' + keys.w + keys.a + keys.s + keys.d
      );*/
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

  let prev = performance.now();
  const loop = () => {
    window.requestAnimationFrame(loop);
    const now = performance.now();
    const delta = (now - prev) / 1000;
    prev = now;
    if (connectedToServer) {
      tick(delta);
    }
  };

  loop();
});
