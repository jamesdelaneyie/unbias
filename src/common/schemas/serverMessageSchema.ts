import { Binary, defineSchema, Schema } from 'nengi';

export const serverMessageSchema: Schema = defineSchema({
  message: Binary.String,
});
