import { NType } from '@/common/NType';
import { ncontext } from '@/common/ncontext';
import { Client, Interpolator } from 'nengi';
import { WebSocketClientAdapter } from 'nengi-websocket-client-adapter';
import { initRenderer } from './utilities';
import { setupGraphicsWorld, setupUI } from './GPUUI';
import { InputSystem } from './InputSystem';
import { handleUserInput } from '@/client/handleUserInput';
import { notificationService, NotificationType } from './NotificationService';
import { updateLocalStates } from './handleState';
import { IEntityMap, PlayerEntityMap, ObjectEntityMap } from '@/common/types';
import { connectToServer, scheduleReconnect } from './ConnectionManager';
import * as p2 from 'p2-es';
import { updateGraphics } from '@/client/graphics/updateGraphics';
import { worldConfig } from '@/common/worldConfig';
let connectedToServer = false;

let entities: IEntityMap = new Map();
let playerEntities: PlayerEntityMap = new Map();
let objectEntities: ObjectEntityMap = new Map();

window.addEventListener('load', async () => {
  const app = await initRenderer();
  const worldContainer = setupGraphicsWorld(app);
  setupUI(app);

  const worldState = {
    myId: null,
  };
  const world = new p2.World({
    gravity: [0, 0],
  });

  const client = new Client(ncontext, WebSocketClientAdapter, worldConfig.serverTickRate);

  notificationService.addNotification('Local app loaded', NotificationType.INFO);

  connectedToServer = await connectToServer(client);
  if (!connectedToServer) {
    scheduleReconnect(client);
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

    updateLocalStates(
      istate,
      worldState,
      worldContainer,
      app,
      world,
      entities,
      playerEntities,
      objectEntities
    );

    client.network.predictionErrorFrames.forEach(frame => {
      console.log('predictionErrorFrames', frame);
      //const errors = client.predictor.getErrors(frame);
      //reconcileEntities(errors, entities, delta);
    });

    // turn the users input into a move command
    // and send it to the server and return a prediction
    // of the x,y,rotation of the local player
    const prediction = handleUserInput(
      client,
      userInput,
      worldState,
      playerEntities,
      worldContainer,
      delta
    );

    // update the physics world
    // applies velocities to the p2 bodies and updates their positions
    world.step(1 / 60);

    // update the graphics of players and objects
    // based both on the prediction and the current network state
    updateGraphics(prediction, playerEntities, objectEntities, delta);

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
