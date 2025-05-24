import { PlayerEntity } from '@/common/types';
import { MoveCommand } from '@/common/types';

export const applyMoveCommand = (entity: PlayerEntity, command: MoveCommand) => {
  if (!entity.body) return;

  let unitX = 0;
  let unitY = 0;
  if (command.w) unitY -= 1;
  if (command.s) unitY += 1;
  if (command.a) unitX -= 1;
  if (command.d) unitX += 1;

  // if space is pressed, move faster
  if (command.space) {
    if (unitX !== 0) unitX *= 4;
    if (unitY !== 0) unitY *= 4;
  }

  // normalize
  const len = Math.sqrt(unitX * unitX + unitY * unitY);
  if (len > 0) {
    unitX /= len;
    unitY /= len;
  }

  const moveModifier = command.space ? 1 : 2;
  const moveSpeed = entity.speed / moveModifier;

  entity.body.velocity = [unitX * moveSpeed, unitY * moveSpeed];
  entity.body.angle = command.rotation;
  entity.rotation = command.rotation;
};
