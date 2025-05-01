import { NType } from '@/common/NType';
import { ncontext } from '@/common/ncontext';
import { Client, Interpolator, IEntity } from 'nengi';
import { WebSocketClientAdapter } from 'nengi-websocket-client-adapter';
import { Application, Container } from 'pixi.js';
import { createNotificationBox, addNotification, addUsernameField } from './HTMLUI';
import { createPlayerGraphics, createObjectGraphics } from './Graphics';
import { drawBasicText } from './GPUUI';
import { InputSystem } from './InputSystem';
import { handleUserInput } from '@/client/handleUserInput';
import { updatePlayerEntity, deletePlayer, updatePlayerGraphics } from './handleState';
import { IEntityMap, PlayerEntityMap, PlayerEntity, ObjectEntity } from '@/common/types';
import { worldConfig } from '@/common/worldConfig';

const MAX_RECONNECT_ATTEMPTS = worldConfig.maxReconnectAttempts;
const RECONNECT_DELAY = worldConfig.reconnectDelay;

let connected = false;
let reconnectTimeout: number | null = null;
let reconnectAttempts = 0;

let entities: IEntityMap = new Map();
let playerEntities: PlayerEntityMap = new Map();

let notificationBox: HTMLDivElement;

const cleanup = () => {
  entities.forEach((player: IEntity) => player.graphics?.destroy());
  entities.clear();
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
  }
};

const setupUsername = (usernameField: HTMLInputElement, client: Client) => {
  const existingUsername = localStorage.getItem('username') || '';
  if (existingUsername) {
    console.log('existingUsername', existingUsername);
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
};

const connectToServer = async (client: Client, notificationBox: HTMLDivElement) => {
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
      setupUsername(usernameField, client);
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
};

const scheduleReconnect = (client: Client, notificationBox: HTMLDivElement) => {
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
    const success = await connectToServer(client, notificationBox);
    if (!success) {
      scheduleReconnect(client, notificationBox);
    }
  }, RECONNECT_DELAY);
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

  notificationBox = createNotificationBox(document);

  const client = new Client(ncontext, WebSocketClientAdapter, 20);

  client.setDisconnectHandler(() => {
    addNotification(document, notificationBox, 'Disconnected from server');
    connected = false;
    cleanup();
    scheduleReconnect(client, notificationBox);
  });

  addNotification(document, notificationBox, 'local app loaded');

  const success = await connectToServer(client, notificationBox);
  if (!success) {
    scheduleReconnect(client, notificationBox);
  }

  const userInput = new InputSystem();
  const interpolator = new Interpolator(client);

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
      snapshot.createEntities.forEach((entity: IEntity) => {
        if (entity.ntype === NType.Entity) {
          const playerEntity = entity as unknown as PlayerEntity;
          entities.set(entity.nid, entity);
          playerEntities.set(entity.nid, playerEntity);
          createPlayerGraphics(playerEntity, app);
        } else if (entity.ntype === NType.Object) {
          const objectEntity = entity as unknown as ObjectEntity;
          createObjectGraphics(app, objectEntity, worldContainer);
        }
      });

      snapshot.updateEntities.forEach((diff: IEntity) => {
        updatePlayerEntity(diff, worldState, entities);
        //updateObject(diff, entities);
      });

      snapshot.deleteEntities.forEach((nid: number) => {
        console.log('deleteEntity', nid);
        deletePlayer(nid, entities);
      });
    });

    /* Smooth player movement */
    playerEntities.forEach(playerEntity => {
      updatePlayerGraphics(playerEntity, worldState, delta);
    });

    handleUserInput(userInput, worldState, playerEntities, client, app, delta);

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
