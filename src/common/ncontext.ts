// ncontext is all of the schemas, like nengiConfig.js from nengi 1.x
import { Context } from 'nengi';
import { NetworkType } from './NetworkType';
import { playerEntitySchema } from './schemas/playerEntitySchema';
import { staticObjectSchema } from './schemas/objectSchemas';
import { dynamicObjectSchema } from './schemas/objectSchemas';
import { identityMessageSchema } from './schemas/identityMessageSchema';
import { moveCommand } from './schemas/moveCommand';
import { usernameSchema } from './schemas/usernameSchema';
import { shotImpactCommand } from './schemas/shotImpactCommand';
import { shotImpactMessage } from './schemas/shotImpactMessage';

const ncontext = new Context();

ncontext.register(NetworkType.PlayerEntity, playerEntitySchema);
ncontext.register(NetworkType.StaticObject, staticObjectSchema);
ncontext.register(NetworkType.DynamicObject, dynamicObjectSchema);
ncontext.register(NetworkType.IdentityMessage, identityMessageSchema);
ncontext.register(NetworkType.MoveCommand, moveCommand);
ncontext.register(NetworkType.UsernameCommand, usernameSchema);
ncontext.register(NetworkType.ShotImpactCommand, shotImpactCommand);
ncontext.register(NetworkType.ShotImpactMessage, shotImpactMessage);

export { ncontext };
