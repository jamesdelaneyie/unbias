# Network Architecture

This document describes the networking architecture of the UNBIAS multiplayer game engine, including communication patterns, synchronization strategies, and lag compensation mechanisms.

## 🌐 Overview

UNBIAS uses an **authoritative server architecture** with **client-side prediction** and **server reconciliation** to provide responsive gameplay while maintaining consistency across all clients.

### Key Principles

- **Server Authority**: All game state changes are validated and applied on the server
- **Client Prediction**: Clients predict the results of their actions for immediate feedback
- **Lag Compensation**: Server rewinds time for hit detection to account for network latency
- **Efficient Synchronization**: Only relevant state changes are broadcast to clients

## 🏗️ Architecture Components

### Client-Server Model

```
┌─────────────┐    Commands     ┌─────────────┐    State Updates    ┌─────────────┐
│   Client A  │ ──────────────► │   Server    │ ──────────────────► │   Client B  │
│             │                 │             │                     │             │
│ Prediction  │ ◄────────────── │ Authority   │ ◄────────────────── │ Prediction  │
│ Rendering   │   Corrections   │ Physics     │   Commands          │ Rendering   │
└─────────────┘                 │ Validation  │                     └─────────────┘
                                 └─────────────┘
```

### Network Stack

1. **Transport Layer**: WebSockets for reliable, bi-directional communication
2. **Protocol Layer**: Custom nengi.js binary protocol for efficient serialization
3. **Message Layer**: Typed command/state messages with schemas
4. **Game Layer**: Entity synchronization and game logic

## 📨 Message Types

### Client → Server (Commands)

#### Movement Commands

```typescript
interface MoveCommand {
  ntype: NetworkType.MoveCommand;
  nid: number; // Entity ID
  w: boolean; // Forward
  a: boolean; // Left
  s: boolean; // Backward
  d: boolean; // Right
  space: boolean; // Jump/Action
  leftClick: boolean; // Primary action
  rotation: number; // Player rotation
  delta: number; // Frame delta time
}
```

#### Shot Commands

```typescript
interface ShotImpactCommand {
  ntype: NetworkType.ShotImpactCommand;
  nid: number;
  fromX: number; // Shot origin
  fromY: number;
  hitX: number; // Target location
  hitY: number;
  targetNid: number; // Target entity ID
  impactForce: number; // Damage/force amount
  originNid: number; // Shooter ID
}
```

#### Identity Commands

```typescript
interface UsernameCommand {
  ntype: NetworkType.UsernameCommand;
  nid: number;
  username: string;
}
```

### Server → Client (State Updates)

#### Entity State

```typescript
interface PlayerEntity {
  nid: number;
  x: number; // Position
  y: number;
  rotation: number; // Orientation
  username: string;
  isAlive: boolean;
  color: number;
  speed: number;
  size: number;
  health: number; // Health points
}
```

#### Game Messages

```typescript
interface ServerMessage {
  ntype: NetworkType.ServerMessage;
  message: string;
  type: ServerMessageType; // global, local, private
  x?: number; // For spatial messages
  y?: number;
}
```

#### Shot Impact Feedback

```typescript
interface ShotImpactMessage {
  ntype: NetworkType.ShotImpactMessage;
  targetNid: number;
  fromX: number;
  fromY: number;
  x: number; // Impact location
  y: number;
  force: number;
}
```

## ⚡ Client-Side Prediction

### Prediction Flow

1. **User Input**: Player presses movement key
2. **Immediate Application**: Client applies movement locally
3. **Command Transmission**: Send command to server
4. **Visual Update**: Update graphics immediately
5. **Server Response**: Receive authoritative state
6. **Reconciliation**: Correct any prediction errors

### Implementation

```typescript
// Client prediction example
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

// Apply prediction immediately
if (prediction) {
  localPlayer.x = prediction.x;
  localPlayer.y = prediction.y;
  localPlayer.rotation = prediction.rotation;
}
```

### Prediction Reconciliation

```typescript
// Handle server corrections
const handlePredictionErrors = (client, worldState, entities) => {
  const serverState = client.getSnapshot();

  if (serverState) {
    const localPlayer = entities.get(worldState.myId);
    const serverPlayer = serverState.entities.get(worldState.myId);

    if (localPlayer && serverPlayer) {
      const positionError = distance(localPlayer, serverPlayer);

      if (positionError > ERROR_THRESHOLD) {
        // Smooth correction over multiple frames
        applyCorrectionSmoothing(localPlayer, serverPlayer);
      }
    }
  }
};
```

## 🎯 Lag Compensation

### Hit Detection with Time Rewind

```typescript
const lagCompensatedHitscanCheck = (
  space: ChannelAABB2D,
  world: p2.World,
  fromX: number,
  fromY: number,
  hitX: number,
  hitY: number,
  timeAgo: number
) => {
  // Rewind world state by player's latency
  const historicalState = historian.getSnapshot(timeAgo);

  // Perform hit detection in historical context
  const result = performRaycast(historicalState, fromX, fromY, hitX, hitY);

  // Apply results in current time
  if (result.hit) {
    applyDamage(result.target, result.damage);
  }
};
```

### Latency Calculation

```typescript
// Server calculates client latency
const clientLatency = socket.user.latency; // RTT/2
const compensationTime = clientLatency + BUFFER_TIME;
```

## 🔄 State Synchronization

### Spatial Partitioning

The server uses spatial channels to efficiently broadcast updates:

```typescript
// Only send updates to clients in relevant areas
const space = new ChannelAABB2D(instance.localState, historian);

// Subscribe client to view area
const viewSize = 2200;
const view = new AABB2D(playerX, playerY, viewSize, viewSize);
space.subscribe(user, view);
```

### Entity Interpolation

Clients smooth between network updates using interpolation:

```typescript
const interpolator = new Interpolator(client);
const istate = interpolator.getInterpolatedState(100); // 100ms buffer

// Smooth movement between network states
entity.renderTarget.x = lerp(entity.x, istate.x, deltaTime);
entity.renderTarget.y = lerp(entity.y, istate.y, deltaTime);
```

### Delta Compression

Only changed entity properties are transmitted:

```typescript
// Server tracks entity changes
if (entity.x !== entity.lastSentX || entity.y !== entity.lastSentY) {
  space.addEntity(entity); // Queue for transmission
  entity.lastSentX = entity.x;
  entity.lastSentY = entity.y;
}
```

## 📊 Performance Optimizations

### Message Batching

```typescript
// Batch multiple commands per frame
const commands = [];
commands.push(moveCommand);
commands.push(shotCommand);
client.sendCommands(commands); // Send as batch
```

### View Culling

```typescript
// Only sync entities within client view
const entitiesInView = space.getEntitiesInView(clientView);
entitiesInView.forEach(entity => {
  client.addEntityUpdate(entity);
});
```

### Update Frequency Scaling

```typescript
// Reduce update frequency for distant entities
const distance = getDistance(player, entity);
const updateFrequency = distance > 1000 ? 20 : 60; // 20 TPS vs 60 TPS
```

## 🛡️ Security Considerations

### Server Validation

```typescript
// Validate all client commands
const validateMoveCommand = (command: MoveCommand, player: PlayerEntity) => {
  // Check movement bounds
  if (distance(player.lastPosition, command.position) > MAX_MOVE_DISTANCE) {
    return false;
  }

  // Validate timing
  if (command.delta > MAX_DELTA_TIME) {
    return false;
  }

  return true;
};
```

### Rate Limiting

```typescript
// Limit command frequency per client
const commandRateLimit = new Map<number, number>();

const isRateLimited = (userId: number) => {
  const lastCommand = commandRateLimit.get(userId) || 0;
  const now = Date.now();

  if (now - lastCommand < MIN_COMMAND_INTERVAL) {
    return true;
  }

  commandRateLimit.set(userId, now);
  return false;
};
```

### Input Sanitization

```typescript
// Sanitize user inputs
const sanitizeUsername = (username: string): string => {
  return username
    .replace(/[<>]/g, '') // Remove HTML
    .substring(0, 20) // Limit length
    .trim();
};
```

## 🔍 Debugging & Monitoring

### Network Metrics

```typescript
interface NetworkMetrics {
  latency: number; // Round-trip time
  packetLoss: number; // Lost message percentage
  bandwidth: number; // Bytes per second
  messagesPerSecond: number;
  entityCount: number;
}
```

### Performance Tracking

```typescript
// Track networking performance
const networkingStart = performanceMonitor.startTiming('networkingTime');
processNetworkMessages();
performanceMonitor.endTiming('networkingTime', networkingStart);
```

### Debug Visualization

```typescript
// Visualize prediction errors (development mode)
if (DEBUG_MODE) {
  drawPredictionError(localPosition, serverPosition);
  drawLatencyIndicator(client.latency);
  drawEntityInterpolation(entity.position, entity.renderTarget);
}
```

## 🚀 Best Practices

### Client Implementation

- **Predict Aggressively**: Apply user input immediately
- **Reconcile Smoothly**: Blend server corrections over time
- **Cache Commands**: Store sent commands for reconciliation
- **Interpolate Entities**: Smooth network updates for visual quality

### Server Implementation

- **Validate Everything**: Never trust client data
- **Use Spatial Partitioning**: Only sync relevant entities
- **Implement Lag Compensation**: Account for network delays
- **Monitor Performance**: Track and optimize bottlenecks

### Network Protocol

- **Binary Serialization**: Use efficient data formats
- **Delta Compression**: Only send changed data
- **Message Priorities**: Critical updates first
- **Graceful Degradation**: Handle connection issues

## 📈 Scalability Considerations

### Horizontal Scaling

- **Stateless Servers**: Multiple game server instances
- **Load Balancing**: Distribute players across servers
- **Cross-Server Communication**: For global features

### Vertical Scaling

- **Physics Optimization**: Reduce computational overhead
- **Memory Management**: Efficient entity storage
- **Update Culling**: Skip unnecessary calculations

This architecture provides a solid foundation for real-time multiplayer games while maintaining performance, security, and user experience across varying network conditions.
