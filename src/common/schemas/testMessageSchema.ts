import { Binary, defineSchema, Schema } from 'nengi'

export const testMessageSchema: Schema = defineSchema({
    message: Binary.String
}) 