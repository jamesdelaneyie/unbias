import { Client, Binary } from 'nengi';
import { NType } from '@/common/NType';
import { PlayerEntityMap, MoveCommand, ObjectEntityMap } from '@/common/types';
import { applyCommand } from '@/common/applyCommand';
import { commandSchema } from '@/common/schemas/commandSchema';
import { InputSystem } from '@/client/InputSystem';
import { Application } from 'pixi.js';
import { CollisionSystem } from '@/client/CollisionSystem';

const handleUserInput = (
  inputSystem: InputSystem,
  worldState: any,
  playerEntities: PlayerEntityMap,
  objectEntities: ObjectEntityMap,
  client: Client,
  app: Application,
  delta: number
) => {
  const input = inputSystem.frameState;
  inputSystem.releaseKeys();

  const { myId } = worldState;
  const myEntity = playerEntities.get(myId);
  if (myEntity) {
    const screenX = inputSystem.currentState.mx;
    const screenY = inputSystem.currentState.my;
    const point = app.stage.toLocal({ x: screenX, y: screenY });
    const dx = point.x - myEntity.x;
    const dy = point.y - myEntity.y;
    const rotation = Math.atan2(dy, dx);

    if (myEntity) {
      const command: MoveCommand = {
        ntype: NType.Command,
        nid: myEntity.nid,
        w: input.w as unknown as Binary.Boolean,
        a: input.a as unknown as Binary.Boolean,
        s: input.s as unknown as Binary.Boolean,
        d: input.d as unknown as Binary.Boolean,
        rotation: rotation,
        delta,
      };
      client.addCommand(command);

      // Calculate the proposed position after applying the command
      const originalX = myEntity.x;
      const originalY = myEntity.y;

      // Apply move command to get proposed position
      applyCommand(myEntity, command);

      const proposedX = myEntity.x;
      const proposedY = myEntity.y;

      // Reset position for collision check
      myEntity.x = originalX;
      myEntity.y = originalY;

      // Convert ObjectEntityMap to array for collision detection
      const objectsArray = Array.from(objectEntities.values());

      // Get collision-adjusted position
      const adjustedPosition = CollisionSystem.moveWithCollisions(
        myEntity,
        proposedX,
        proposedY,
        objectsArray
      );

      // Set the entity position to the collision-adjusted position
      myEntity.x = adjustedPosition.x;
      myEntity.y = adjustedPosition.y;

      // save the result of applying the command as a prediction
      const prediction = {
        nid: myEntity.nid,
        x: myEntity.x,
        y: myEntity.y,
      };
      client.predictor.addCustom(client.serverTickRate, prediction, ['x', 'y'], commandSchema);

      // also apply the result of the prediction to the graphical entity
      const playerGraphics = playerEntities.get(prediction.nid)?.graphics;
      if (playerGraphics) {
        playerGraphics.x = prediction.x;
        playerGraphics.y = prediction.y;
        playerGraphics.rotation = rotation;
      }
    }
  }
};

export { handleUserInput };
