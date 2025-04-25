import { Binary, defineSchema, Schema } from 'nengi'

export const entitySchema: Schema = defineSchema({
   x: Binary.Float32,
   y: Binary.Float32
}) 