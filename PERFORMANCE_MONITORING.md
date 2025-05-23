# Performance Monitoring System

This document describes the comprehensive performance monitoring system implemented in the game server and client.

## Overview

The performance monitoring system tracks various server metrics in real-time and transmits them to connected clients for display. This allows developers and administrators to monitor server health, identify performance bottlenecks, and optimize the game experience.

## Server-Side Monitoring

### Tracked Metrics

#### Frame Performance

- **Frame Time**: Total time to process one server tick (milliseconds)
- **Tick Rate**: Server update frequency (ticks per second)
- **Command Processing Time**: Time spent processing client commands (milliseconds)
- **Message Queue Size**: Number of pending network events

#### Physics Engine

- **Physics Step Time**: Total time for physics calculations (milliseconds)
- **World Step Time**: Time for p2.js world.step() operation (milliseconds)
- **Raycast Time**: Time spent on raycasting operations (milliseconds)
- **Entity Update Time**: Time to update entity positions/rotations (milliseconds)

#### System Resources

- **Memory Usage**: Server heap memory usage (MB)
- **CPU Usage**: Approximate CPU utilization percentage
- **Entity Count**: Total number of entities in the world
- **Player Count**: Number of connected players
- **Dynamic Entity Count**: Number of dynamic (moving) entities

### Implementation

The `PerformanceMonitor` class (`src/server/PerformanceMonitor.ts`) provides:

- High-resolution timing using `performance.now()`
- Memory usage tracking via `process.memoryUsage()`
- CPU usage estimation via `process.cpuUsage()`
- Metrics aggregation and reset functionality

Performance data is collected every server tick and transmitted to clients every 60 ticks (approximately once per second at 60 TPS).

## Client-Side Display

### Compact Performance Panels

Six compact performance panels are displayed in the bottom-left corner:

1. **FPS**: Client frame rate
2. **MS**: Client render time per frame
3. **Physics**: Server physics step time
4. **Memory**: Client memory usage
5. **Latency**: Network round-trip time
6. **SRV MB**: Server memory usage
7. **Entities**: Total entity count

### Detailed Performance Overlay

Press **'P'** to toggle a detailed performance metrics overlay that shows:

- Complete breakdown of all server timing metrics
- Color-coded indicators (green/orange/red) based on performance thresholds
- Real-time entity counts and system resource usage
- Last update timestamp

#### Performance Color Coding

- **Green**: Good performance (within optimal range)
- **Orange**: Warning level (approaching performance limits)
- **Red**: Poor performance (exceeding recommended thresholds)

**Thresholds:**

- Frame Time: Good ≤ 16ms, Warning ≤ 33ms
- Physics Step: Good ≤ 5ms, Warning ≤ 10ms
- Server Memory: Good ≤ 100MB, Warning ≤ 200MB

## Network Protocol

Performance metrics are transmitted using the `PerformanceMetrics` network type with the following schema:

```typescript
{
  frameTime: Binary.Float32,
  tickRate: Binary.Float32,
  physicsStepTime: Binary.Float32,
  worldStepTime: Binary.Float32,
  raycastTime: Binary.Float32,
  entityUpdateTime: Binary.Float32,
  entityCount: Binary.Int16,
  playerCount: Binary.Int16,
  dynamicEntityCount: Binary.Int16,
  commandProcessingTime: Binary.Float32,
  messageQueueSize: Binary.Int16,
  memoryUsage: Binary.Float32,
  cpuUsage: Binary.Float32,
  timestamp: Binary.Float32,
}
```

## Usage

### For Developers

1. **Identifying Bottlenecks**: Watch the detailed metrics to see which operations consume the most time
2. **Performance Regression Testing**: Compare metrics before/after code changes
3. **Load Testing**: Monitor how metrics change under different player loads
4. **Optimization Validation**: Verify that optimizations actually improve performance

### For Server Administrators

1. **Health Monitoring**: Keep an eye on memory usage and CPU utilization
2. **Capacity Planning**: Use entity counts and timing data to determine server limits
3. **Alerting**: Set up automated alerts based on performance thresholds

## Key Files

- `src/server/PerformanceMonitor.ts` - Core monitoring implementation
- `src/server/instance.ts` - Performance monitoring integration
- `src/client/performanceUI.ts` - Compact performance panels
- `src/client/DetailedPerformanceUI.ts` - Detailed metrics overlay
- `src/client/handleMessages.ts` - Client-side metrics processing
- `src/common/schemas/performanceMetricsSchema.ts` - Network schema
- `src/common/NetworkType.ts` - Network type definitions

## Performance Impact

The monitoring system is designed to have minimal performance impact:

- Timing operations use high-resolution `performance.now()`
- Metrics are aggregated once per frame
- Network transmission occurs only once per second
- Client display updates are throttled and optional

## Future Enhancements

Potential improvements to the monitoring system:

- Historical data collection and charting
- Configurable alert thresholds
- Performance metrics export for external monitoring tools
- Per-system breakdown (e.g., collision detection vs. integration)
- Network bandwidth usage tracking
