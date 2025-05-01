import { Client, Interpolator } from 'nengi';
import { NType } from '@/common/NType';
import { ncontext } from '@/common/ncontext';
import { WebSocketClientAdapter } from 'nengi-websocket-client-adapter';
import { Application, Container, Graphics, Sprite } from 'pixi.js';
import { createNotificationBox, addNotification, addUsernameField } from './HTMLUI';
import { createPlayerGraphics, createObjectGraphics } from './Graphics';
import { drawBasicText } from './GPUUI';
import { InputSystem } from './InputSystem';
import handleUserInput from '@/client/handleUserInput';

type EntityMap = Map<number, any>;
let entities: EntityMap = new Map();
let reconnectTimeout: number | null = null;

const updatePlayer = (entity: any, entities: EntityMap) => {
  const playerGraphics = entities.get(entity.nid)?.graphics;
  const property = entity.prop;
  const value = entity.value;
  if (playerGraphics) {
    if (property === 'x') {
      playerGraphics.x = value;
    }
    if (property === 'y') {
      playerGraphics.y = value;
    }
    if (property === 'rotation') {
      playerGraphics.rotation = value;
    }
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

  drawBasicText(masterContainer, 'BIAS 2.0', 10, 10);

  const worldState = {
    myRawId: null,
  };

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

  const userInput = new InputSystem();

  const tick = (delta: number) => {
    if (!connected) {
      return;
    }

    const istate = interpolator.getInterpolatedState(100);

    while (client.network.messages.length > 0) {
      const message = client.network.messages.pop();
      console.log('Received message:', message);
      if (message.ntype === NType.IdentityMessage) {
        console.log('IdentityMessage', message);
        worldState.myRawId = message.myId;
        console.log(worldState);
      }
    }

    istate.forEach(snapshot => {
      snapshot.createEntities.forEach((entity: any) => {
        if (entity.ntype === NType.Entity) {
          entities.set(entity.nid, entity);
          createPlayerGraphics(entity, app);
        } else if (entity.ntype === NType.Object) {
          createObjectGraphics(app, entity, worldContainer, entities);
        }
      });

      snapshot.updateEntities.forEach((diff: any) => {
        updatePlayer(diff, entities);
        updateObject(diff, entities);
      });

      snapshot.deleteEntities.forEach((nid: number) => {
        console.log('deleteEntity', nid);
        deletePlayer(nid, entities);
      });
    });

    handleUserInput(userInput, worldState, entities, client, app, delta);

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
