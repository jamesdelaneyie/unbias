import { networkContext } from '@/common/networkContext';
import { Client, Interpolator } from 'nengi';
import { WebSocketClientAdapter } from 'nengi-websocket-client-adapter';
import { initRenderer } from './utilities';
import { setupGraphicsWorld, setupUI } from './GPUUI';
import { InputSystem } from './inputControls/InputSystem';
import { handleUserInput } from '@/client/inputControls/handleUserInput';
import { notificationService, NotificationType } from './UIManager';
import { updateLocalStates } from './handleState';
import { IEntityMap, PlayerEntityMap, ObjectEntityMap } from '@/common/types';
import { connectToServer, scheduleReconnect } from './ConnectionManager';
import * as p2 from 'p2-es';
import { updateGraphics } from '@/client/graphics/updateGraphics';
import { config } from '@/common/config';
import { handlePredictionErrors } from '@/client/handlePredictionError';
import '@pixi/layout/devtools';
import { performanceBegin, performanceEnd, setupPerformanceUI } from './performanceUI';
import { handleMessages } from '@/client/handleMessages';
import { RadialMenuManager } from './inputControls/RadialMenuManager';
import { Container } from 'pixi.js';
import { Crosshairs } from '@/client/inputControls/Crosshairs';

let connectedToServer = false;

let entities: IEntityMap = new Map();
let playerEntities: PlayerEntityMap = new Map();
let objectEntities: ObjectEntityMap = new Map();

window.addEventListener('load', async () => {
  const { app, viewport } = await initRenderer();
  const worldContainer = setupGraphicsWorld(app, viewport);
  setupUI(app);

  const stats = setupPerformanceUI();

  const worldState = {
    myId: null,
  };
  const world = new p2.World({
    gravity: [0, 10],
    islandSplit: true,
  });
  // @ts-ignore
  world.solver.iterations = 10;
  world.defaultContactMaterial.friction = 0;
  world.defaultContactMaterial.restitution = 0.1;

  const client = new Client(networkContext, WebSocketClientAdapter, config.serverTickRate);

  // Initialize the Pixi-based notification log
  notificationService.setupPixi(app, client);

  notificationService.addNotification('Local app loaded', NotificationType.INFO);

  connectedToServer = await connectToServer(client);
  if (!connectedToServer) {
    scheduleReconnect(client);
  }

  const userInput = new InputSystem();
  const interpolator = new Interpolator(client);
  const radialMenuManager = new RadialMenuManager(app);
  const crosshairs = new Crosshairs();

  // Add crosshairs to worldContainer with high z-index so they render on top
  crosshairs.zIndex = 1000;
  viewport.addChild(crosshairs);

  // Set the world container for backdrop blur
  radialMenuManager.setWorldContainer(worldContainer);

  const tick = (delta: number) => {
    const istate = interpolator.getInterpolatedState(100);

    handleMessages(client, notificationService, worldState, worldContainer);

    updateLocalStates(
      istate,
      worldState,
      viewport,
      app,
      world,
      entities,
      playerEntities,
      objectEntities
    );

    handlePredictionErrors(client, worldState, entities);

    //userInput.prepareFrameInput();

    const point = viewport.toLocal({
      x: userInput.frameState.mx,
      y: userInput.frameState.my,
    });
    crosshairs.x = point.x;
    crosshairs.y = point.y;

    // turn the users input into a move command
    // and send it to the server and return a prediction
    // of the x,y,rotation of the local player
    const prediction = handleUserInput(
      client,
      userInput,
      worldState,
      playerEntities,
      objectEntities,
      viewport,
      delta,
      world
    );

    // Handle radial menu input after the main input processing
    radialMenuManager.handleInput(userInput);

    // update the physics world
    // applies velocities to the p2 bodies and updates their positions
    world.step(config.worldStepRate);

    // update the graphics of players and objects
    // based both on the prediction and the current network state
    updateGraphics(prediction, playerEntities, objectEntities, delta);

    if (worldState.myId) {
      const player = playerEntities.get(worldState.myId);
      if (player) {
        viewport.follow(player.clientGraphics as Container, {
          speed: 0,
          acceleration: 0.2,
          radius: 10,
        });
      }
    }

    client.flush();
  };

  let prev = performance.now();
  const loop = () => {
    performanceBegin(client, stats);
    window.requestAnimationFrame(loop);
    performanceEnd(stats);
    const now = performance.now();
    const delta = (now - prev) / 1000;
    prev = now;
    if (connectedToServer) {
      tick(delta);
    }
  };

  loop();
});
