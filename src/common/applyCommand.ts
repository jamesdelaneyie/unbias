import { PlayerEntity } from '@/common/types';
import { MoveCommand } from '@/common/types';

export const applyCommand = (entity: PlayerEntity, command: MoveCommand) => {
  entity.rotation = command.rotation;

  // Calculate the movement vector
  let unitX = 0;
  let unitY = 0;
  if (command.w) unitY += 1;
  if (command.s) unitY -= 1;
  if (command.a) unitX -= 1;
  if (command.d) unitX += 1;
  // normalize
  const len = Math.sqrt(unitX * unitX + unitY * unitY);
  if (len > 0) {
    unitX /= len;
    unitY /= len;
  }

  if (!entity.body) return;

  const moveSpeed = entity.speed / 2;
  entity.body.velocity = [unitX * moveSpeed, unitY * moveSpeed];
  entity.body.angle = entity.rotation;
};
