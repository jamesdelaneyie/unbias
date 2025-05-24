import * as p2 from 'p2-es';
import { Instance, NetworkEvent, ChannelAABB2D, Historian, AABB2D, User, Channel } from 'nengi';
import { uWebSocketsInstanceAdapter } from 'nengi-uws-instance-adapter';
import { NetworkType } from '../common/NetworkType';
import { networkContext } from '../common/networkContext';

import { Command, MoveCommand, ObjectEntity, UsernameCommand, Entity } from '../common/types';
import { PlayerEntity } from '../common/PlayerEntity';
import { createPlayerEntity, deletePlayerEntity } from '../server/EntityManager';

import { applyMoveCommand } from './applyCommands/applyMoveCommand';
import { applyShotCommand } from './applyCommands/applyShotCommand';

import { config } from '../common/config';
import { loadMap } from './loadMap';
import { ServerMessageType } from '../common/schemas/serverMessageSchema';
import { PerformanceMonitor } from './PerformanceMonitor';
import { PhysicsWorldCleaner } from './PhysicsWorldCleaner';
import { rayPool } from './PhysicsUtils';

/* Create a nengi instance based on the shared network context */
const instance = new Instance(networkContext);
/* Setup the uWebsockets adapter */
const uws = new uWebSocketsInstanceAdapter(instance.network, {});
uws.listen(config.port, () => {
  console.log(`uws adapter is listening on ${config.port}`);
});

/* Create a nengi historian to track the state of the world */
const historian = new Historian(networkContext, config.serverTickRate);

/* Create a main global channel and a 2d spacial channel for entities */
const main = new Channel(instance.localState);
const space = new ChannelAABB2D(instance.localState, historian);

const users = new Map<number, User>();

const staticEntities: Map<number, Entity> = new Map();
const dynamicEntities: Map<number, Entity> = new Map();
const ObjectEntities: Map<number, ObjectEntity> = new Map();
const playerEntities: Map<number, PlayerEntity> = new Map();

// Performance monitoring
const performanceMonitor = new PerformanceMonitor();
let performanceMetricsCounter = 0;
const PERFORMANCE_METRICS_INTERVAL = 10; // Send metrics every 60 ticks (1 second at 60 TPS)

const world = new p2.World({ gravity: [0, 10], islandSplit: true });
// @ts-ignore
world.solver.iterations = 10;
world.defaultContactMaterial.friction = 0;
world.defaultContactMaterial.restitution = 0.1;

// CRITICAL FIX: Move event listeners OUTSIDE the update loop
world.on('beginContact', event => {
  const bodyA = event.bodyA;
  const bodyB = event.bodyB;

  let playerEntity = null;
  let objectEntity = null;

  const playerA = Array.from(playerEntities.values()).find(p => p.body === bodyA);
  const objectB = Array.from(ObjectEntities.values()).find(o => o.body === bodyB);
  if (playerA && objectB) {
    playerEntity = playerA;
    objectEntity = objectB;
  }

  const playerB = Array.from(playerEntities.values()).find(p => p.body === bodyB);
  const objectA = Array.from(ObjectEntities.values()).find(o => o.body === bodyA);
  if (playerB && objectA) {
    playerEntity = playerB;
    objectEntity = objectA;
  }

  if (playerEntity && objectEntity) {
    objectEntity.color = playerEntity.color;
  }
});

// Track bodies to clean up
const bodiesToRemove = new Set<p2.Body>();
// Physics world maintenance
const physicsWorldCleaner = new PhysicsWorldCleaner();

instance.onConnect = async (handshake: any) => {
  console.log('handshake received', handshake.token);
  return true;
};

const queue = instance.queue;
let mapLoaded = false;

const mapName = 'debugMap';

const update = () => {
  performanceMonitor.startFrame();

  // Track queue size and command processing
  let queueSize = 0;
  const commandProcessingStart = performanceMonitor.startTiming('commandProcessingTime');

  while (!queue.isEmpty()) {
    queueSize++;
    const networkEvent = queue.next();

    if (!mapLoaded) {
      mapLoaded = loadMap(space, world, staticEntities, dynamicEntities, mapName);
    }

    if (networkEvent.type === NetworkEvent.UserConnected) {
      const { user } = networkEvent;
      //console.log('user connected', user);
      const viewSize = 2200;
      const view = new AABB2D(0, 0, viewSize, viewSize);
      space.subscribe(user, view);
      main.addMessage({
        ntype: NetworkType.ServerMessage,
        message: 'Anonymous has joined the server',
        type: ServerMessageType.global,
      });
    }

    if (networkEvent.type === NetworkEvent.UserDisconnected) {
      const { user } = networkEvent;
      deletePlayerEntity(user, main, space, playerEntities, world);
    }

    if (networkEvent.type === NetworkEvent.CommandSet) {
      const { user, commands } = networkEvent;
      if (commands.length > 0) {
        commands.forEach((command: Command) => {
          if (command.ntype === NetworkType.MoveCommand) {
            const player = playerEntities.get(command.nid);
            const moveCommand = command as MoveCommand;
            if (player) {
              applyMoveCommand(player, moveCommand);
            }
          }
          if (command.ntype === NetworkType.UsernameCommand) {
            const usernameCommand = command as UsernameCommand;
            const usernameTaken = Array.from(playerEntities.values()).find(
              entity => entity.username === usernameCommand.username
            );
            if (usernameTaken) {
              console.warn('Username already taken');
              return;
            }
            try {
              const player = createPlayerEntity(user, usernameCommand);
              if (player) {
                space.addEntity(player);
                main.addEntity(player);
                space.subscribe(user, player.view);
                main.subscribe(user);
                world.addBody(player.body);
                // @ts-ignore
                player.body.nid = player.nid;
                playerEntities.set(player.nid, player);
                dynamicEntities.set(player.nid, player);
                users.set(user.id, user);
                console.log('player created', player?.username);
                user.queueMessage({
                  myId: player.nid,
                  ntype: NetworkType.IdentityMessage,
                  username: usernameCommand.username,
                });
                main.addMessage({
                  ntype: NetworkType.ServerMessage,
                  message: `${usernameCommand.username} has joined the server`,
                  type: ServerMessageType.global,
                });
                space.addMessage({
                  ntype: NetworkType.ServerMessage,
                  message: `${usernameCommand.username} has joined the area`,
                  type: ServerMessageType.local,
                  x: player.x,
                  y: player.y,
                });
              }
            } catch (error) {
              console.error('Error creating player entity', error);
            }
          }
          if (command.ntype === NetworkType.ShotImpactCommand) {
            applyShotCommand(
              command,
              dynamicEntities,
              ObjectEntities,
              playerEntities,
              bodiesToRemove,
              world,
              rayPool,
              performanceMonitor,
              space,
              main
            );
          }
        });
      }
    }
  }

  performanceMonitor.endTiming('commandProcessingTime', commandProcessingStart);
  performanceMonitor.setMetric('messageQueueSize', queueSize);

  // Physics step with performance monitoring
  const physicsStart = performanceMonitor.startTiming('physicsStepTime');
  const worldStepStart = performanceMonitor.startTiming('worldStepTime');
  world.step(config.worldStepRate);
  performanceMonitor.endTiming('worldStepTime', worldStepStart);
  performanceMonitor.endTiming('physicsStepTime', physicsStart);

  // CRITICAL FIX: Clean up physics bodies after world step
  bodiesToRemove.forEach(body => {
    try {
      world.removeBody(body);
    } catch (error) {
      console.warn('Failed to remove body from physics world:', error);
    }
  });
  bodiesToRemove.clear();

  // Entity updates with performance monitoring
  const entityUpdateStart = performanceMonitor.startTiming('entityUpdateTime');
  dynamicEntities.forEach(entity => {
    entity.x = entity.body.position[0];
    entity.y = entity.body.position[1];
    entity.rotation = entity.body.angle;
  });
  performanceMonitor.endTiming('entityUpdateTime', entityUpdateStart);

  // Set entity counts
  performanceMonitor.setMetric('entityCount', staticEntities.size + dynamicEntities.size);
  performanceMonitor.setMetric('playerCount', playerEntities.size);
  performanceMonitor.setMetric('dynamicEntityCount', dynamicEntities.size);
  performanceMonitor.setMetric('tickRate', config.serverTickRate);

  // CRITICAL MONITORING: Track physics world health
  performanceMonitor.setMetric('physicsBodyCount', world.bodies.length);
  performanceMonitor.setMetric('physicsContactPairs', world.narrowphase.contactEquations.length);
  // @ts-ignore
  performanceMonitor.setMetric('physicsSolverIterations', world.solver.iterations);

  // Periodic physics world cleanup
  physicsWorldCleaner.cleanupWorld(world, playerEntities, ObjectEntities);

  // Send performance metrics to clients periodically
  performanceMetricsCounter++;
  if (performanceMetricsCounter >= PERFORMANCE_METRICS_INTERVAL) {
    performanceMonitor.endFrame();
    const metrics = performanceMonitor.getMetrics();

    // Send to all connected users
    main.addMessage({
      ntype: NetworkType.PerformanceMetrics,
      ...metrics,
    });

    performanceMonitor.reset();
    performanceMetricsCounter = 0;
  }

  instance.step();
};

setInterval(() => {
  update();
}, 1000 / config.serverTickRate);
