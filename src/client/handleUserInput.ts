import { Client } from 'nengi';
import { NType } from '@/common/NType';
import { PlayerEntityMap, MoveCommand } from '@/common/types';
import { entitySchema } from '@/common/schemas/entitySchema';
import { InputSystem } from '@/client/InputSystem';
import { Container } from 'pixi.js';

const handleUserInput = (
  client: Client,
  inputSystem: InputSystem,
  worldState: any,
  playerEntities: PlayerEntityMap,
  worldContainer: Container,
  delta: number
) => {
  if (document.hidden) return;

  const inputState = inputSystem.frameState;
  inputSystem.releaseKeys();

  const { myId } = worldState;
  const myEntity = playerEntities.get(myId);
  if (myEntity && myEntity.body) {
    const screenX = inputState.mx;
    const screenY = inputState.my;
    const point = worldContainer.toLocal({ x: screenX, y: screenY });
    const dx = point.x - myEntity.x;
    const dy = point.y - myEntity.y;
    const rotation = Math.atan2(dy, dx);

    // @ts-ignore
    const command: MoveCommand = {
      ntype: NType.MoveCommand,
      nid: myEntity.nid,
      w: inputState.w,
      a: inputState.a,
      s: inputState.s,
      d: inputState.d,
      space: inputState.space,
      rotation: rotation,
      delta: delta,
    };

    // Send the user's movement command to the server
    client.addCommand(command);

    // Calculate the movement vector
    let unitX = 0;
    let unitY = 0;
    if (command.w) unitY += 1;
    if (command.s) unitY -= 1;
    if (command.a) unitX -= 1;
    if (command.d) unitX += 1;

    if (inputState.space) {
      if (unitX !== 0) unitX += 4;
      if (unitY !== 0) unitY += 4;
    }

    const len = Math.sqrt(unitX * unitX + unitY * unitY);
    if (len > 0) {
      unitX /= len;
      unitY /= len;
    }

    let moveModifier = 10;
    if (inputState.space) moveModifier = 5;

    // Update the entity's velocity and rotation
    const moveSpeed = myEntity.speed / moveModifier;
    myEntity.body.velocity = [unitX * moveSpeed, unitY * moveSpeed];
    myEntity.body.angle = rotation;

    // Predict the entity's position based on it's body velocity
    const predictedX = myEntity.x + unitX * moveSpeed * delta;
    const predictedY = myEntity.y + unitY * moveSpeed * delta;

    const prediction = {
      nid: myEntity.nid,
      x: predictedX,
      y: predictedY,
      rotation: rotation,
    };

    // Add the prediction to the local predictor
    client.predictor.addCustom(
      client.network.clientTick,
      prediction,
      ['x', 'y', 'rotation'],
      entitySchema
    );

    return prediction;
  }
};

export { handleUserInput };
