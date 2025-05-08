import { PlayerEntityMap, ObjectEntityMap, ObjectEntity } from '@/common/types';
import { isPredictionDifferentToCurrentState } from '../handleState';
import {
  updateLocalPlayerGraphicsWithPrediction,
  updateRemotePlayerGraphics,
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
    } else {
      updateRemotePlayerGraphics(playerEntity, delta);
    }
  });

  objectEntities.forEach((object: ObjectEntity) => {
    if (object.graphics) {
      updateObjectGraphics(object, delta);
    }
  });
};

export { updateGraphics };
