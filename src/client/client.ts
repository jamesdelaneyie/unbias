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
  createPlayerEntity,
  updatePlayerEntity,
  deletePlayerEntity,
  createObjectEntity,
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
import * as p2 from 'p2-es';
import { createGridGraphics } from '@/client/graphics/worldGraphics';
import { updateRemotePlayerGraphics } from '@/client/graphics/playerGraphics';
import reconcileEntities from '@/client/reconcileEntities';
import { worldConfig } from '@/common/worldConfig';
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
  //@ts-ignore Allows PixiJS dev tools
  globalThis.__PIXI_APP__ = app;

  document.body.appendChild(app.canvas);

  const UserInterfaceContainer = new Container();
  UserInterfaceContainer.label = 'UserInterfaceContainer';
  UserInterfaceContainer.zIndex = 1000;
  app.stage.addChild(UserInterfaceContainer);

  drawBasicText(UserInterfaceContainer, 'BIAS 2.0', 10, 10);

  const worldContainer = new Container();
  worldContainer.label = 'worldContainer';
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

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      userInput.resetKeys();
    }
  });

  const interpolator = new Interpolator(client);

  const tick = (delta: number) => {
    world.step(1 / 60);

    playerEntities.forEach(p => {
      if (p.body) {
        p.x = p.body.position[0];
        p.y = p.body.position[1];
        p.rotation = p.body.angle;
      }
    });

    objectEntities.forEach(o => {
      if (o.body) {
        o.x = o.body.position[0];
        o.y = o.body.position[1];
        o.rotation = o.body.angle;
        // Update graphics directly from local physics body state (AFTER world.step)
        // Remove interpolation for immediate local collision response.
        if (o.graphics) {
          const t = Math.min(1, worldConfig.playerSmoothing * delta);
          // Snap graphics to the current physics body position
          o.graphics.x += (o.body.position[0] - o.graphics.x) * t;
          o.graphics.y += (o.body.position[1] - o.graphics.y) * t;
          // Snap graphics rotation too
          o.graphics.rotation += (o.body.angle - o.graphics.rotation) * t;
        }
      }
    });

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
        updatePlayerEntity(diff, worldState, playerEntities);
        updateObjectEntity(diff, objectEntities);
      });

      snapshot.deleteEntities.forEach((nid: number) => {
        deletePlayerEntity(nid, playerEntities);
      });
    });

    client.network.predictionErrorFrames.forEach(frame => {
      const errors = client.predictor.getErrors(frame);
      reconcileEntities(errors, entities, delta);
    });

    playerEntities.forEach(playerEntity => {
      if (playerEntity.nid !== worldState.myId) {
        updateRemotePlayerGraphics(playerEntity, delta);
      }
    });

    handleUserInput(client, userInput, worldState, playerEntities, worldContainer, delta);

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
