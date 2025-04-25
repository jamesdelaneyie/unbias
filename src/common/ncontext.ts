// ncontext is all of the schemas, like nengiConfig.js from nengi 1.x
import { Context } from 'nengi'
import { NType } from './NType'
import { testMessageSchema } from './schemas/testMessageSchema'

const ncontext = new Context()
ncontext.register(NType.TestMessage, testMessageSchema)

export { ncontext }