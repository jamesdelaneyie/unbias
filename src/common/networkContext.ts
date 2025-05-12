// ncontext is all of the schemas, like nengiConfig.js from nengi 1.x
import { Context } from 'nengi';
import { NetworkType } from './NetworkType';
import { playerEntitySchema } from './schemas/playerEntitySchema';
import { objectSchema } from './schemas/objectSchema';
import { identityMessageSchema } from './schemas/identityMessageSchema';
import { moveCommand } from './schemas/moveCommand';
import { usernameSchema } from './schemas/usernameSchema';

const ncontext = new Context();

ncontext.register(NetworkType.PlayerEntity, playerEntitySchema);
ncontext.register(NetworkType.IdentityMessage, identityMessageSchema);
ncontext.register(NetworkType.MoveCommand, moveCommand);
ncontext.register(NetworkType.Object, objectSchema);
ncontext.register(NetworkType.UsernameCommand, usernameSchema);

export { ncontext };
