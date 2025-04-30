import { Binary, defineSchema, Schema } from 'nengi';

export const usernameSchema: Schema = defineSchema({
  username: Binary.String,
});
