// ncontext is all of the schemas, like nengiConfig.js from nengi 1.x
import { Context } from 'nengi';
import { NType } from './NType';
import { entitySchema } from './schemas/entitySchema';
import { objectSchema } from './schemas/objectSchema';
import { identityMessageSchema } from './schemas/identityMessageSchema';
import { commandSchema } from './schemas/commandSchema';
import { usernameSchema } from './schemas/usernameSchema';

const ncontext = new Context();

ncontext.register(NType.Entity, entitySchema);
ncontext.register(NType.IdentityMessage, identityMessageSchema);
ncontext.register(NType.Command, commandSchema);
ncontext.register(NType.Object, objectSchema);
ncontext.register(NType.UsernameCommand, usernameSchema);

export { ncontext };
