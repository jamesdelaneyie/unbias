import { Binary, defineSchema, Schema } from 'nengi';

export const objectSchema: Schema = defineSchema({
  x: Binary.Float32,
  y: Binary.Float32,
  width: Binary.UInt8,
  height: Binary.UInt8,
  color: Binary.Float64,
  shape: Binary.String,
});
