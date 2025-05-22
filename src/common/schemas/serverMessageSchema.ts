import { Binary, defineSchema, Schema } from 'nengi';

export enum ServerMessageType {
  global = 1,
  local = 2,
  private = 3,
}

export const serverMessageSchema: Schema = defineSchema({
  message: Binary.String,
  type: Binary.Int8,
  x: Binary.Float32,
  y: Binary.Float32,
});
