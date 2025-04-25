import { Binary, defineSchema, Schema } from 'nengi'

export const commandSchema: Schema = defineSchema({
    w: Binary.Boolean,
    a: Binary.Boolean,
    s: Binary.Boolean,
    d: Binary.Boolean,
    delta: Binary.Float32
})