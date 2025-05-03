import { NType } from '@/common/NType';
import { ncontext } from '@/common/ncontext';
import { Client, Interpolator, IEntity } from 'nengi';
import { WebSocketClientAdapter } from 'nengi-websocket-client-adapter';
import { Application, Container } from 'pixi.js';
import { createNotificationBox, addNotification } from './HTMLUI';
import { drawBasicText } from './GPUUI';
import { InputSystem } from './InputSystem';
import { handleUserInput } from '@/client/handleUserInput';
import {
  updatePlayerEntity,
  deletePlayer,
  updatePlayerGraphics,
  updateObjectGraphics,
  //updateObjectEntity,
  createPlayerEntity,
  createObjectEntity,
} from './handleState';
import {
  IEntityMap,
  PlayerEntityMap,
  PlayerEntity,
  ObjectEntity,
  ObjectEntityMap,
} from '@/common/types';
import { connectToServer, scheduleReconnect } from './ConnectionManager';
import * as p2 from 'p2-es';
import { createGridGraphics } from './Graphics';
let connectedToServer = false;

let entities: IEntityMap = new Map();
let playerEntities: PlayerEntityMap = new Map();
let objectEntities: ObjectEntityMap = new Map();
let notificationBox: HTMLDivElement;

window.addEventListener('load', async () => {
  const app = new Application();
  await app.init({
    antialias: true,
    autoDensity: true,
    background: '#000000',
    resolution: window.devicePixelRatio,
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
  worldContainer.scale.x = 50;
  worldContainer.scale.y = -50;
  app.stage.addChild(worldContainer);

  createGridGraphics(app, worldContainer, 300);

  notificationBox = createNotificationBox(document);

  const world = new p2.World({
    gravity: [0, 0],
  });
  const client = new Client(ncontext, WebSocketClientAdapter, 20);

  const worldState = {
    myId: null,
  };

  addNotification(document, notificationBox, 'local app loaded');

  connectedToServer = await connectToServer(client, notificationBox);
  if (!connectedToServer) {
    scheduleReconnect(client, notificationBox);
  }

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
          playerEntity.isSelf = playerEntity.nid === worldState.myId;
          entities.set(entity.nid, entity);
          playerEntities.set(entity.nid, playerEntity);
          createPlayerEntity(playerEntity, worldContainer, app, world);
        } else if (entity.ntype === NType.Object) {
          const objectEntity = entity as ObjectEntity;
          entities.set(entity.nid, entity);
          objectEntities.set(entity.nid, objectEntity);
          createObjectEntity(objectEntity, worldContainer, app, world);
        }
      });

      snapshot.updateEntities.forEach((diff: IEntity) => {
        updatePlayerEntity(diff, worldState, entities);
        //updateObjectEntity(diff, objectEntities);
      });

      snapshot.deleteEntities.forEach((nid: number) => {
        deletePlayer(nid, entities);
      });
    });

    // Step physics world
    world.step(1 / 60);

    //const errors = client.predictor.getErrors();
    //console.log('Errors:', errors);

    // Sync physics with entities (except the local player, which is handled in handleUserInput)
    playerEntities.forEach(playerEntity => {
      updatePlayerGraphics(playerEntity, worldState, delta);
    });

    objectEntities.forEach(objectEntity => {
      updateObjectGraphics(objectEntity);
    });

    handleUserInput(
      client,
      userInput,
      worldState,
      playerEntities,
      objectEntities,
      worldContainer,
      delta
    );

    client.flush();

    //const errors = client.predictor.getErrors(client.network.frames[0]);
    //console.log('Errors:', errors);
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
