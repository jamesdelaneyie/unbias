import { NetworkType } from '@/common/NetworkType';
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
import { config } from '@/common/config';
import { handlePredictionErrors } from '@/client/handlePredictionError';
import Stats from 'stats.js';
import { drawHitscan } from '@/client/graphics/drawHitscan';
import '@pixi/layout/devtools';

let connectedToServer = false;

let entities: IEntityMap = new Map();
let playerEntities: PlayerEntityMap = new Map();
let objectEntities: ObjectEntityMap = new Map();

window.addEventListener('load', async () => {
  const app = await initRenderer();
  const worldContainer = setupGraphicsWorld(app);
  const performanceStats = {
    fps: 0,
    clientTick: 0,
    latency: 0,
    avgTimeDifference: 0,
    memory: 0,
    totalMemory: 0,
    networkMessages: 0,
    networkBytesIn: 0,
    networkBytesOut: 0,
  };
  setupUI(app);
  // Initialize the Pixi-based notification log
  notificationService.setupPixi(app);

  const fpsStats = new Stats();
  fpsStats.showPanel(0);
  fpsStats.dom.style.left = '10px';
  fpsStats.dom.style.bottom = '10px';
  fpsStats.dom.style.top = 'initial';
  const msStats = new Stats();
  msStats.showPanel(1);
  msStats.dom.style.left = '90px';
  msStats.dom.style.bottom = '10px';
  msStats.dom.style.top = 'initial';
  const memoryStats = new Stats();
  memoryStats.showPanel(2);
  memoryStats.dom.style.left = '170px';
  memoryStats.dom.style.bottom = '10px';
  memoryStats.dom.style.top = 'initial';
  let latencyMaxYAxis = 0;
  const latencyStatsPanel = new Stats.Panel('ms Lag', '#0ff', '#002');
  const latencyStats = new Stats();
  latencyStats.showPanel(3);
  latencyStats.addPanel(latencyStatsPanel);
  latencyStats.dom.style.left = '250px';
  latencyStats.dom.style.bottom = '10px';
  latencyStats.dom.style.top = 'initial';
  document.body.appendChild(fpsStats.dom);
  document.body.appendChild(msStats.dom);
  document.body.appendChild(memoryStats.dom);
  document.body.appendChild(latencyStats.dom);

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

  const client = new Client(ncontext, WebSocketClientAdapter, config.serverTickRate);

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
      if (message.ntype === NetworkType.IdentityMessage) {
        worldState.myId = message.myId;
      }
      if (message.ntype === NetworkType.ShotImpactMessage) {
        drawHitscan(worldContainer, message.fromX, message.fromY, message.x, message.y, 0x0000ff);
      }
      if (message.ntype === NetworkType.ServerMessage) {
        notificationService.addNotification(message.message, NotificationType.INFO);
      }
      performanceStats.networkMessages++;
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

    handlePredictionErrors(client, worldState, entities);

    // turn the users input into a move command
    // and send it to the server and return a prediction
    // of the x,y,rotation of the local player
    const prediction = handleUserInput(
      client,
      userInput,
      worldState,
      playerEntities,
      objectEntities,
      worldContainer,
      delta,
      world
    );

    // update the physics world
    // applies velocities to the p2 bodies and updates their positions
    world.step(config.worldStepRate);

    // update the graphics of players and objects
    // based both on the prediction and the current network state
    updateGraphics(prediction, playerEntities, objectEntities, delta);

    //client.network.clientTick;
    client.flush();
  };

  let prev = performance.now();
  const loop = () => {
    fpsStats.begin();
    msStats.begin();
    memoryStats.begin();
    latencyStats.begin();
    latencyMaxYAxis = Math.max(100, client.network.latency * 1.2);
    latencyStatsPanel.update(client.network.latency, latencyMaxYAxis);
    window.requestAnimationFrame(loop);
    fpsStats.end();
    msStats.end();
    memoryStats.end();
    latencyStats.end();
    const now = performance.now();
    const delta = (now - prev) / 1000;
    prev = now;
    if (connectedToServer) {
      tick(delta);
    }
  };

  loop();
});
