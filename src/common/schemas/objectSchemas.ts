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
  vertices: Binary.String,
  color: Binary.Float64,
  stroke: Binary.Float64,
});

export const dynamicObjectSchema: Schema = defineSchema({
  label: Binary.String,
  x: { type: Binary.Float32, interp: true },
  y: { type: Binary.Float32, interp: true },
  rotation: { type: Binary.Rotation32, interp: true },
  shape: Binary.String,
  width: Binary.UInt8,
  height: Binary.UInt8,
  radius: Binary.Float32,
  mass: Binary.UInt8,
  vertices: Binary.String,
  color: Binary.Float64,
  stroke: Binary.Float64,
});
