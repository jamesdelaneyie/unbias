import { Binary, defineSchema, Schema } from 'nengi';

// No need for floats or interpolation for static objects
export const staticObjectSchema: Schema = defineSchema({
  label: Binary.String,
  x: Binary.Int32,
  y: Binary.Int32,
  rotation: Binary.Int32,
  shape: Binary.String,
  width: Binary.UInt8,
  height: Binary.UInt8,
  radius: Binary.Float32,
  vertices: Binary.Float32Array,
  color: Binary.Float64,
});

export const dynamicObjectSchema: Schema = defineSchema({
  x: { type: Binary.Float32, interp: true },
  y: { type: Binary.Float32, interp: true },
  rotation: { type: Binary.Rotation32, interp: true },
  width: Binary.UInt8,
  height: Binary.UInt8,
  mass: Binary.UInt8,
  color: Binary.Float64,
  shape: Binary.String,
  radius: Binary.Float32,
});
