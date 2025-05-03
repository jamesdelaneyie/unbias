import { PredictionErrorFrame, PredictionErrorEntity, PredictionErrorProperty } from 'nengi';
import { IEntityMap } from '@/common/types';

const reconcileEntities = (predictionErrorFrame: PredictionErrorFrame, entities: IEntityMap) => {
  predictionErrorFrame.entities.forEach((predictionErrorEntity: PredictionErrorEntity) => {
    console.log('predictionErrorEntity', predictionErrorEntity);
    const entity = entities.get(predictionErrorEntity.nid);

    if (!entity) {
      console.error('Entity not found', predictionErrorEntity.nid);
      return;
    }

    // rewind state for frame that was incorrect
    Object.assign(entity, predictionErrorEntity.proxy);

    // correct any state that was incorrect, using the server values
    predictionErrorEntity.errors.forEach((predictionError: PredictionErrorProperty) => {
      console.log('predictionError', predictionError);
      entity[predictionError.prop] = predictionError.actualValue;
    });
  });
};

export default reconcileEntities;
