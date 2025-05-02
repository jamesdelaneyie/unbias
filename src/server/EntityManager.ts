import { User, AABB2D, ChannelAABB2D, Channel } from 'nengi';
import { PlayerEntity } from '@/server/PlayerEntity';
import { NType } from '@/common/NType';
import { UsernameCommand } from '@/common/types';
const createPlayerEntity = (
  user: User,
  usernameCommand: UsernameCommand,
  space: ChannelAABB2D,
  playerEntities: Map<number, PlayerEntity>
) => {
  try {
    const viewSize = 1100;
    const newUser = new PlayerEntity(user, usernameCommand.username);
    newUser.x = viewSize / 2 + Math.random() * 200;
    newUser.y = viewSize / 2;
    // creates a local view for the playerEntity for culling
    newUser.view = new AABB2D(0, 0, viewSize, viewSize);
    space.subscribe(user, newUser.view);
    space.addEntity(newUser); // assigns an nid to the playerEntity
    playerEntities.set(newUser.nid, newUser);
    user.queueMessage({
      myId: newUser.nid,
      ntype: NType.IdentityMessage,
      username: usernameCommand.username,
    });
  } catch (error) {
    console.error('Error creating player entity', error);
  }
};

const deletePlayerEntity = (
  user: User,
  space: ChannelAABB2D,
  main: Channel,
  playerEntities: Map<number, PlayerEntity>
) => {
  try {
    const playerEntity = Array.from(playerEntities.values()).find(entity => entity.id === user.id);
    if (playerEntity) {
      const nId = playerEntity.nid;
      main.unsubscribe(user);
      space.unsubscribe(user);
      main.removeEntity(playerEntity);
      space.removeEntity(playerEntity);
      playerEntities.delete(nId);
    }
  } catch (error) {
    console.error('Error deleting player entity', error);
  }
};

export { createPlayerEntity, deletePlayerEntity };
