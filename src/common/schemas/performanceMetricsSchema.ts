import { Binary, defineSchema, Schema } from 'nengi';

export const performanceMetricsSchema: Schema = defineSchema({
  // Overall frame metrics
  frameTime: Binary.Float32,
  tickRate: Binary.Float32,

  // Physics metrics
  physicsStepTime: Binary.Float32,
  worldStepTime: Binary.Float32,
  raycastTime: Binary.Float32,

  // Entity metrics
  entityUpdateTime: Binary.Float32,
  entityCount: Binary.Int16,
  playerCount: Binary.Int16,
  dynamicEntityCount: Binary.Int16,

  // Network metrics
  commandProcessingTime: Binary.Float32,
  messageQueueSize: Binary.Int16,

  // Memory/performance indicators
  memoryUsage: Binary.Float32,
  cpuUsage: Binary.Float32,

  // Timestamp for client-side tracking
  timestamp: Binary.Float32,
});
