import { Client } from 'nengi';
import { NType } from '@/common/NType';
import { PlayerEntityMap, MoveCommand } from '@/common/types';
import { moveCommand } from '@/common/schemas/moveCommand';
import { InputSystem } from '@/client/InputSystem';
import { Container } from 'pixi.js';
import { worldConfig } from '@/common/worldConfig';
const handleUserInput = (
  client: Client,
  inputSystem: InputSystem,
  worldState: any,
  playerEntities: PlayerEntityMap,
  worldContainer: Container,
  delta: number
) => {
  if (document.hidden) {
    return;
  }
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

    if (myEntity.body) {
      const command: MoveCommand = {
        ntype: NType.MoveCommand,
        nid: myEntity.nid,
        w: inputState.w,
        a: inputState.a,
        s: inputState.s,
        d: inputState.d,
        rotation: rotation,
        delta: delta,
      };

      client.addCommand(command);

      let unitX = 0;
      let unitY = 0;
      if (command.w) unitY += 1;
      if (command.s) unitY -= 1;
      if (command.a) unitX -= 1;
      if (command.d) unitX += 1;

      const len = Math.sqrt(unitX * unitX + unitY * unitY);
      if (len > 0) {
        unitX /= len;
        unitY /= len;
      }

      const moveSpeed = myEntity.speed / 2;
      myEntity.body.velocity = [unitX * moveSpeed, unitY * moveSpeed];

      myEntity.body.angle = rotation;

      const predictedX = myEntity.x + unitX * moveSpeed * delta;
      const predictedY = myEntity.y + unitY * moveSpeed * delta;

      const prediction = {
        nid: myEntity.nid,
        x: predictedX,
        y: predictedY,
      };
      client.predictor.addCustom(client.serverTickRate, prediction, ['x', 'y'], moveCommand);

      const playerGraphics = myEntity.clientGraphics;
      const playerGraphicsBody = playerGraphics?.getChildByLabel('playerBodyContainer');
      if (playerGraphics && playerGraphicsBody) {
        const t = Math.min(1, worldConfig.playerSmoothing * delta);
        playerGraphics.x += (predictedX - playerGraphics.x) * t;
        playerGraphics.y += (predictedY - playerGraphics.y) * t;
        playerGraphicsBody.rotation = rotation;
      }
    }
  }
};

export { handleUserInput };
