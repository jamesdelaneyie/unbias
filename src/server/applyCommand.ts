import { PlayerEntity } from '@/common/types';
import { MoveCommand } from '@/common/types';

export const applyCommand = (entity: PlayerEntity, command: MoveCommand) => {
  entity.rotation = command.rotation;

  // Calculate the movement vector
  let unitX = 0;
  let unitY = 0;
  if (command.w) unitY -= 1;
  if (command.s) unitY += 1;
  if (command.a) unitX -= 1;
  if (command.d) unitX += 1;

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

  if (!entity.body) return;

  let moveModifier = 2;
  if (command.space) moveModifier = 1;

  const moveSpeed = entity.speed / moveModifier;
  entity.body.velocity = [unitX * moveSpeed, unitY * moveSpeed];
  entity.body.angle = entity.rotation;
};
