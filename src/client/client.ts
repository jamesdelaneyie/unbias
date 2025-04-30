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

const deletePlayer = (nid: number, entities: EntityMap) => {
  const player = entities.get(nid);
  if (player) {
    player.parent?.removeChild(player);
    player.destroy({ children: true });
    entities.delete(nid);
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
  const client = new Client(ncontext, WebSocketClientAdapter, 20);
  let connected = false;

  // Movement keys
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

  // Reconnection settings
  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_DELAY = 2000; // 2 seconds
  let reconnectAttempts = 0;
  let reconnectTimeout: number | null = null;

  function setupUsername(usernameField: HTMLInputElement) {
    const existingUsername = localStorage.getItem('username') || '';
    if (existingUsername) {
      /*usernameField.value = existingUsername;
      client.addCommand({
        ntype: NType.UsernameCommand,
        username: existingUsername,
      });*/
    }

    let usernameSubmitted = false;
    usernameField.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !usernameSubmitted) {
        const username = (e.target as HTMLInputElement).value.trim();
        if (username) {
          usernameSubmitted = true;
          localStorage.setItem('username', username);
          client.addCommand({
            ntype: NType.UsernameCommand,
            username,
          });
          usernameField.disabled = true;
        }
      }
    });
  }

  async function connectToServer() {
    try {
      const res = await client.connect('ws://localhost:9001', { token: 12345 });
      if (res === 'accepted') {
        addNotification(
          document,
          notificationBox,
          reconnectAttempts > 0 ? 'Reconnected to server' : 'Connected to server'
        );
        connected = true;
        reconnectAttempts = 0;
        if (reconnectTimeout) {
          clearTimeout(reconnectTimeout);
          reconnectTimeout = null;
        }

        // Show username field and handle username
        const usernameField = addUsernameField(document, notificationBox);
        setupUsername(usernameField);
        return true;
      } else {
        addNotification(document, notificationBox, 'Connection error');
        return false;
      }
    } catch (err) {
      console.warn(err);
      addNotification(document, notificationBox, 'Connection error');
      return false;
    }
  }

  function scheduleReconnect() {
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
    reconnectTimeout = window.setTimeout(async () => {
      const success = await connectToServer();
      if (!success) {
        scheduleReconnect();
      }
    }, RECONNECT_DELAY);
  }

  client.setDisconnectHandler(() => {
    addNotification(document, notificationBox, 'Disconnected from server');
    connected = false;
    cleanup();
    scheduleReconnect();
  });

  addNotification(document, notificationBox, 'local app loaded');
  const success = await connectToServer();
  if (!success) {
    scheduleReconnect();
  }

  const interpolator = new Interpolator(client);

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
          console.log('createPlayerEntity', entity);
          createPlayerGraphics(entity, app, entities);
        } else if (entity.ntype === NType.Object) {
          console.log('createObjectGraphics', entity);
          createObjectGraphics(app, entity, worldContainer, entities);
        }
      });

      snapshot.updateEntities.forEach((diff: any) => {
        //console.log('updateEntity', diff);
        updatePlayer(diff, entities);
        updateObject(diff, entities);
      });

      snapshot.deleteEntities.forEach((nid: number) => {
        console.log('deleteEntity', nid);
        deletePlayer(nid, entities);
      });
    });

    if (keys.w || keys.a || keys.s || keys.d) {
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
    tick(delta);
  };

  loop();
});
