import { Binary, defineSchema, Schema } from 'nengi';

export const moveCommand: Schema = defineSchema({
  w: Binary.Boolean,
  a: Binary.Boolean,
  s: Binary.Boolean,
  d: Binary.Boolean,
  space: Binary.Boolean,
  rotation: Binary.Float32,
  delta: Binary.Float32,
});
