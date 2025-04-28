// ncontext is all of the schemas, like nengiConfig.js from nengi 1.x
import { Context } from 'nengi';
import { NType } from './NType';
import { entitySchema } from './schemas/entitySchema';
import { identityMessageSchema } from './schemas/identityMessageSchema';
import { commandSchema } from './schemas/commandSchema';

const ncontext = new Context();
ncontext.register(NType.Entity, entitySchema);
ncontext.register(NType.IdentityMessage, identityMessageSchema);
ncontext.register(NType.Command, commandSchema);

export { ncontext };
