import { User, AABB2D, ChannelAABB2D } from 'nengi';
import { PlayerEntity } from '../common/PlayerEntity';
import { ObjectEntity, UsernameCommand } from '../common/types';
import * as p2 from 'p2-es';

const createPlayerEntity = (user: User, usernameCommand: UsernameCommand) => {
  try {
    const viewSize = 1100;
    const newUser = new PlayerEntity(user, usernameCommand.username);
    newUser.x = 1;
    newUser.y = 1;
    // creates a local view for the playerEntity for network culling
    newUser.view = new AABB2D(0, 0, viewSize, viewSize);
    return newUser;
  } catch (error) {
    console.error('Error creating player entity', error);
  }
};

const deletePlayerEntity = (
  user: User,
  main: ChannelAABB2D,
  playerEntities: Map<number, PlayerEntity>
) => {
  try {
    const playerEntity = Array.from(playerEntities.values()).find(entity => entity.id === user.id);
    if (playerEntity) {
      const nId = playerEntity.nid;
      main.unsubscribe(user);
      main.removeEntity(playerEntity);
      playerEntities.delete(nId);
    }
  } catch (error) {
    console.error('Error deleting player entity', error);
  }
};

const createPhysicalObject = (object: ObjectEntity) => {
  const body = new p2.Body({
    mass: object.mass,
    position: [object.x, object.y],
    angle: object.rotation,
    damping: 0.97,
    angularDamping: 0.999,
    type: object.bodyType,
  });

  const shape = new p2.Box({
    width: object.width,
    height: object.height,
  });

  body.addShape(shape);
  return body;
};

export { createPlayerEntity, deletePlayerEntity, createPhysicalObject };
