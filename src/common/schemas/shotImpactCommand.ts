import { Binary, defineSchema, Schema } from 'nengi';

export const shotImpactCommand: Schema = defineSchema({
  targetNid: Binary.UInt32,
  fromX: Binary.Float32,
  fromY: Binary.Float32,
  hitX: Binary.Float32,
  hitY: Binary.Float32,
  impactForce: Binary.Float32,
});
