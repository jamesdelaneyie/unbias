import { Binary, defineSchema, Schema } from 'nengi';

export const objectSchema: Schema = defineSchema({
  x: { type: Binary.Float32, interp: true },
  y: { type: Binary.Float32, interp: true },
  rotation: { type: Binary.Rotation32, interp: true },
  width: Binary.UInt8,
  height: Binary.UInt8,
  color: Binary.Float64,
  shape: Binary.String,
  mass: Binary.UInt8,
  type: Binary.UInt8,
});
