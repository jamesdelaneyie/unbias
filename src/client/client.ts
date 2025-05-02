import { NType } from '@/common/NType';
import { ncontext } from '@/common/ncontext';
import { Client, Interpolator, IEntity } from 'nengi';
import { WebSocketClientAdapter } from 'nengi-websocket-client-adapter';
import { Application, Container } from 'pixi.js';
import { createNotificationBox, addNotification } from './HTMLUI';
import { createPlayerGraphics, createObjectGraphics } from './Graphics';
import { drawBasicText } from './GPUUI';
import { InputSystem } from './InputSystem';
import { handleUserInput } from '@/client/handleUserInput';
import {
  updatePlayerEntity,
  deletePlayer,
  updatePlayerGraphics,
  updateObjectGraphics,
  updateObjectEntity,
} from './handleState';
import {
  IEntityMap,
  PlayerEntityMap,
  PlayerEntity,
  ObjectEntity,
  ObjectEntityMap,
} from '@/common/types';
import { connectToServer, scheduleReconnect } from './ConnectionManager';
import * as SAT from 'sat';

let connectedToServer = false;

let entities: IEntityMap = new Map();
let playerEntities: PlayerEntityMap = new Map();
let objectEntities: ObjectEntityMap = new Map();
let notificationBox: HTMLDivElement;

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

  const worldContainer = new Container();
  worldContainer.position.x = app.screen.width / 2;
  worldContainer.position.y = app.screen.height / 2;
  worldContainer.scale.x = 100;
  worldContainer.scale.y = -100;
  app.stage.addChild(worldContainer);

  notificationBox = createNotificationBox(document);

  const client = new Client(ncontext, WebSocketClientAdapter, 20);

  const worldState = {
    myId: null,
  };

  addNotification(document, notificationBox, 'local app loaded');

  connectedToServer = await connectToServer(client, notificationBox);
  if (!connectedToServer) {
    scheduleReconnect(client, notificationBox);
  }

  addNotification(document, notificationBox, 'connected to server');

  const userInput = new InputSystem();
  const interpolator = new Interpolator(client);

  const tick = (delta: number) => {
    const istate = interpolator.getInterpolatedState(100);

    while (client.network.messages.length > 0) {
      const message = client.network.messages.pop();
      console.log('Received message:', message);
      if (message.ntype === NType.IdentityMessage) {
        console.log('IdentityMessage', message);
        worldState.myId = message.myId;
        console.log(worldState);
      }
    }

    istate.forEach(snapshot => {
      snapshot.createEntities.forEach((entity: IEntity) => {
        if (entity.ntype === NType.Entity) {
          const playerEntity = entity as PlayerEntity;
          entities.set(entity.nid, entity);
          playerEntity.clientCollisionBody = new SAT.Circle(
            new SAT.Vector(playerEntity.x, playerEntity.y),
            playerEntity.size * 0.75
          );
          playerEntities.set(entity.nid, playerEntity);
          console.log(playerEntity);
          createPlayerGraphics(playerEntity, worldContainer, app);
        } else if (entity.ntype === NType.Object) {
          const objectEntity = entity as ObjectEntity;
          objectEntity.clientCollisionBody = new SAT.Circle(
            new SAT.Vector(objectEntity.x, objectEntity.y),
            objectEntity.width / 3
          );
          objectEntities.set(entity.nid, objectEntity);
          createObjectGraphics(app, objectEntity, worldContainer);
        }
      });

      snapshot.updateEntities.forEach((diff: IEntity) => {
        updatePlayerEntity(diff, worldState, entities);
        updateObjectEntity(diff, objectEntities);
      });

      snapshot.deleteEntities.forEach((nid: number) => {
        deletePlayer(nid, entities);
      });
    });

    /* Smooth player movement */
    playerEntities.forEach(playerEntity => {
      updatePlayerGraphics(playerEntity, worldState, delta);
    });
    objectEntities.forEach(objectEntity => {
      updateObjectGraphics(objectEntity, worldState, delta);
    });

    handleUserInput(userInput, worldState, playerEntities, objectEntities, client, app, delta);

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
