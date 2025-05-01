import { PlayerEntity } from '@/common/types';
import { MoveCommand } from '@/common/types';

export const applyCommand = (entity: PlayerEntity, command: MoveCommand) => {
  entity.rotation = command.rotation;

  let unitX = 0;
  let unitY = 0;

  // create forces from input
  if (command.w) {
    unitY -= 1;
  }
  if (command.s) {
    unitY += 1;
  }
  if (command.a) {
    unitX -= 1;
  }
  if (command.d) {
    unitX += 1;
  }

  // normalize
  const len = Math.sqrt(unitX * unitX + unitY * unitY);
  if (len > 0) {
    unitX = unitX / len;
    unitY = unitY / len;
  }

  const xMove = unitX * entity.speed * command.delta;
  const yMove = unitY * entity.speed * command.delta;
  entity.x += xMove;
  entity.y += yMove;

  // readjusts this entities position by uncolliding it from obstacles
  //CollisionSystem.moveWithCollisions(entity, obstacles, boxes, artworks, infoPanels);
};
