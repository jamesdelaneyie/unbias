import { User, AABB2D, ChannelAABB2D, Channel } from 'nengi';
import { PlayerEntity } from '../common/PlayerEntity';
import { UsernameCommand } from '../common/types';
import { World } from 'p2-es';

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
  main: Channel,
  space: ChannelAABB2D,
  playerEntities: Map<number, PlayerEntity>,
  world: World
) => {
  try {
    const playerEntity = Array.from(playerEntities.values()).find(entity => entity.id === user.id);
    if (playerEntity) {
      const nId = playerEntity.nid;
      main.unsubscribe(user);
      main.removeEntity(playerEntity);
      space.unsubscribe(user);
      space.removeEntity(playerEntity);
      world.removeBody(playerEntity.body);
      playerEntities.delete(nId);
    }
  } catch (error) {
    console.error('Error deleting player entity', error);
  }
};

export { createPlayerEntity, deletePlayerEntity };
