import { Binary, defineSchema, Schema } from 'nengi';

export const shotImpactMessage: Schema = defineSchema({
  targetNid: Binary.UInt32,
  fromX: Binary.Float32,
  fromY: Binary.Float32,
  x: Binary.Float32,
  y: Binary.Float32,
  force: Binary.Float32,
});
