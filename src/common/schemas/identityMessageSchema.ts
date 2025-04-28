import { Binary, defineSchema, Schema } from 'nengi'

export const identityMessageSchema: Schema = defineSchema({
    myId: Binary.UInt16,
}) 