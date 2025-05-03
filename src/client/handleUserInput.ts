import { Client, Binary } from 'nengi';
import { NType } from '@/common/NType';
import { PlayerEntityMap, MoveCommand, ObjectEntityMap } from '@/common/types';
import { applyCommand } from '@/common/applyCommand';
import { commandSchema } from '@/common/schemas/commandSchema';
import { InputSystem } from '@/client/InputSystem';
import { Container } from 'pixi.js';

const handleUserInput = (
  client: Client,
  inputSystem: InputSystem,
  worldState: any,
  playerEntities: PlayerEntityMap,
  objectEntities: ObjectEntityMap,
  worldContainer: Container,
  delta: number
) => {
  const inputState = inputSystem.frameState;
  inputSystem.releaseKeys();

  const { myId } = worldState;
  const myEntity = playerEntities.get(myId);
  if (myEntity) {
    const screenX = inputState.mx;
    const screenY = inputState.my;
    const point = worldContainer.toLocal({ x: screenX, y: screenY });
    const dx = point.x - myEntity.x;
    const dy = point.y - myEntity.y;
    const rotation = Math.atan2(dy, dx);

    if (myEntity) {
      const command: MoveCommand = {
        ntype: NType.Command,
        nid: myEntity.nid,
        w: inputState.w as unknown as Binary.Boolean,
        a: inputState.a as unknown as Binary.Boolean,
        s: inputState.s as unknown as Binary.Boolean,
        d: inputState.d as unknown as Binary.Boolean,
        rotation: rotation,
        delta,
      };

      // Use physics body for movement
      /*if (myEntity.body) {
        // Calculate movement direction
        let unitX = 0;
        let unitY = 0;

        if (command.w) {
          unitY += 1; // reverse y axis
        }
        if (command.s) {
          unitY -= 1; // reverse y axis
        }
        if (command.a) {
          unitX -= 1;
        }
        if (command.d) {
          unitX += 1;
        }

        // Normalize
        const len = Math.sqrt(unitX * unitX + unitY * unitY);
        if (len > 0) {
          unitX = unitX / len;
          unitY = unitY / len;
        }

        // Set velocity directly on the physics body
        const moveSpeed = myEntity.speed;
        myEntity.body.velocity = [unitX * moveSpeed, unitY * moveSpeed];

        // Update rotation
        myEntity.body.angle = rotation;

        // Update entity position from physics body
        myEntity.x = myEntity.body.position[0];
        myEntity.y = myEntity.body.position[1];
        myEntity.rotation = rotation;
      }*/

      //client.addCommand(command);
      applyCommand(myEntity, command);

      // save the result of applying the command as a prediction
      const prediction = {
        nid: myEntity.nid,
        x: myEntity.x,
        y: myEntity.y,
      };
      client.predictor.addCustom(client.serverTickRate, prediction, ['x', 'y'], commandSchema);

      // also apply the result of the prediction to the graphical entity
      const playerEntity = playerEntities.get(prediction.nid);
      if (playerEntity) {
        const playerGraphics = playerEntity.graphics;
        const playerBody = playerEntity.body;
        const playerGraphicsBody = playerGraphics?.getChildByLabel('playerBodyContainer');
        if (playerGraphics) {
          playerGraphics.x = prediction.x;
          playerGraphics.y = prediction.y;
        }
        if (playerGraphicsBody) {
          playerGraphicsBody.rotation = rotation;
        }
        if (playerBody) {
          playerBody.position[0] = prediction.x;
          playerBody.position[1] = prediction.y;
        }
      }
    }
  }
};

export { handleUserInput };
