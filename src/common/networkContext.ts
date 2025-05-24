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
import { serverMessageSchema } from './schemas/serverMessageSchema';
import { performanceMetricsSchema } from './schemas/performanceMetricsSchema';
const networkContext = new Context();

networkContext.register(NetworkType.PlayerEntity, playerEntitySchema);
networkContext.register(NetworkType.StaticObject, staticObjectSchema);
networkContext.register(NetworkType.DynamicObject, dynamicObjectSchema);
networkContext.register(NetworkType.IdentityMessage, identityMessageSchema);
networkContext.register(NetworkType.MoveCommand, moveCommand);
networkContext.register(NetworkType.UsernameCommand, usernameSchema);
networkContext.register(NetworkType.ShotImpactCommand, shotImpactCommand);
networkContext.register(NetworkType.ShotImpactMessage, shotImpactMessage);
networkContext.register(NetworkType.ServerMessage, serverMessageSchema);
networkContext.register(NetworkType.PerformanceMetrics, performanceMetricsSchema);

export { networkContext };
