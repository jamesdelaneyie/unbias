import { Binary, defineSchema, Schema } from 'nengi';

export const entitySchema: Schema = defineSchema({
  x: Binary.Float32,
  y: Binary.Float32,
  size: Binary.UInt8,
  color: Binary.Float64,
  username: Binary.String,
  rotation: Binary.Float32,
  speed: Binary.UInt8,
});
