import { Binary, defineSchema, Schema } from 'nengi';

export const objectSchema: Schema = defineSchema({
  x: Binary.Float32,
  y: Binary.Float32,
  width: Binary.Float32,
  height: Binary.Float32,
  color: Binary.Float64,
  shape: Binary.String,
});
