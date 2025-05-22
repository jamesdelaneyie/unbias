import { Binary, defineSchema, Schema } from 'nengi';

export const playerEntitySchema: Schema = defineSchema({
  x: { type: Binary.Float32, interp: true },
  y: { type: Binary.Float32, interp: true },
  rotation: { type: Binary.Rotation32, interp: true },
  size: Binary.UInt8,
  color: Binary.Float64,
  username: Binary.String,
  speed: Binary.UInt8,
  health: Binary.UInt8,
  isAlive: Binary.Boolean,
});
