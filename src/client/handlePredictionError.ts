import { Client, PredictionErrorEntity, PredictionErrorProperty } from 'nengi';
//import { NetworkType } from '@/common/NetworkType';
import { IEntityMap, IEntity } from '@/common/types';

export function handlePredictionErrors(client: Client, worldState: any, entities: IEntityMap) {
  // errors in clientside prediction (determined based on fresh server data this frame)
  while (client.network.predictionErrorFrames.length > 0) {
    const predictionErrorFrame = client.network.predictionErrorFrames.pop();
    if (!predictionErrorFrame) return;

    const entityState = entities.get(worldState.myId);
    const entity: IEntity | undefined = entityState;

    if (entity !== undefined) {
      predictionErrorFrame.entities.forEach((predictionErrorEntity: PredictionErrorEntity) => {
        // correct any prediction errors with server values...
        predictionErrorEntity.errors.forEach((predictionErrorProperty: PredictionErrorProperty) => {
          const { prop, actualValue } = predictionErrorProperty;
          entity[prop] = actualValue;
          if (prop === 'x') {
            entity.body.position[0] = actualValue;
          } else if (prop === 'y') {
            entity.body.position[1] = actualValue;
          } else if (prop === 'rotation') {
            entity.body.angle = actualValue;
          }
        });

        // and then re-apply any commands issued since the frame that had the prediction error
        /*const unconfirmedCommands = client.network.outbound.getUnconfirmedCommands(); // client knows which commands need redone
        console.log('unconfirmedCommands', unconfirmedCommands);
        unconfirmedCommands.forEach((unconfirmedCommandSet, clientTick) => {
          unconfirmedCommandSet.forEach(unconfirmedCommand => {
            // example assumes 'PlayerInput' is the command we are predicting
            if (unconfirmedCommand.ntype === NetworkType.MoveCommand) {
              // entity.processMove(command)
              move(entity, unconfirmedCommand);
              // client.addCustomPrediction(clientTick, prediction, ['x', 'y']) // overwrite
              const { nid, x, y } = entity;
              client.predictor.addCustom(clientTick, { nid, x, y }, ['x', 'y'], entitySchema);
            }
          });
        });*/
      });
    }
  }
}

/*
import { PredictionErrorFrame, PredictionErrorEntity, PredictionErrorProperty } from 'nengi';
import { IEntityMap, PlayerEntity } from '@/common/types';
import { config } from '@/common/config';

const reconcileEntities = (
  predictionErrorFrame: PredictionErrorFrame | null,
  entities: IEntityMap,
  delta: number
) => {
  if (!predictionErrorFrame) return;

  predictionErrorFrame.entities.forEach((predictionErrorEntity: PredictionErrorEntity) => {
    console.log('predictionErrorEntity', predictionErrorEntity);
    const entity = entities.get(predictionErrorEntity.nid) as PlayerEntity | undefined;

    if (!entity) {
      console.error('Entity not found during reconciliation', predictionErrorEntity.nid);
      return;
    }

    // Rewind entity state - Keep this as is
    Object.assign(entity, predictionErrorEntity.proxy);

    // Correct state and physics body
    predictionErrorEntity.errors.forEach((predictionError: PredictionErrorProperty) => {
      const actualValue = predictionError.actualValue;

      // Always update the entity state directly for nengi
      entity[predictionError.prop] = actualValue;

      // === Physics Body Correction ===
      if (entity.body) {
        // Use a smoothing factor based on delta time
        const smoothingFactor = Math.min(1, config.reconciliationSmoothing * delta);

        if (predictionError.prop === 'x') {
          const errorX = (actualValue as number) - entity.body.position[0];
          // Apply smoothed correction to physics body
          entity.body.position[0] += errorX * smoothingFactor;
          // Reset velocity if the correction is significant? Optional.
          // if (Math.abs(errorX) > 0.1) entity.body.velocity[0] = 0;
        } else if (predictionError.prop === 'y') {
          const errorY = (actualValue as number) - entity.body.position[1];
          // Apply smoothed correction to physics body
          entity.body.position[1] += errorY * smoothingFactor;
          // if (Math.abs(errorY) > 0.1) entity.body.velocity[1] = 0;
        } else if (predictionError.prop === 'rotation') {
          // Snap rotation directly - smoothing angle is more complex and often less necessary
          entity.body.angle = actualValue as number;
          // entity.body.angularVelocity = 0;
        }
      }
    });

    // Final sync is less critical now as we are smoothing towards the server state,
    // but can be kept as a safeguard, although it might counter the smoothing slightly.
    // Consider removing or adjusting this if smoothing feels off.
    /*
    if (entity.body) {
      entity.body.position[0] = entity.x;
      entity.body.position[1] = entity.y;
      entity.body.angle = entity.rotation;
    }
    
});
};

export default reconcileEntities;
*/
