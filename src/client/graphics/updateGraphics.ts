import { PlayerEntityMap, ObjectEntityMap, ObjectEntity } from '@/common/types';
import { isPredictionDifferentToCurrentState } from '../handleState';
import {
  updateLocalPlayerGraphicsWithPrediction,
  updateRemotePlayerGraphics,
  updateLocalPlayerServerGraphics,
} from './playerGraphics';
import { updateObjectGraphics } from './objectGraphics';

const updateGraphics = (
  prediction: any,
  playerEntities: PlayerEntityMap,
  objectEntities: ObjectEntityMap,
  delta: number
) => {
  // update the graphics of the player entities
  playerEntities.forEach(playerEntity => {
    if (playerEntity.isSelf) {
      if (isPredictionDifferentToCurrentState(prediction, playerEntity)) {
        updateLocalPlayerGraphicsWithPrediction(playerEntity, prediction, delta);
      }
      updateLocalPlayerServerGraphics(playerEntity);
    } else {
      updateRemotePlayerGraphics(playerEntity, delta);
    }
  });

  objectEntities.forEach((object: ObjectEntity) => {
    if (object.clientGraphics) {
      updateObjectGraphics(object);
    }
  });
};

export { updateGraphics };
