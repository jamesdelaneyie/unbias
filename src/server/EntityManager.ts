import { User, AABB2D, ChannelAABB2D, Channel } from 'nengi';
import { PlayerEntity } from '../common/PlayerEntity';
import { NType } from '../common/NType';
import { ObjectEntity, UsernameCommand } from '../common/types';
import * as p2 from 'p2-es';

const createPlayerEntity = (
  user: User,
  usernameCommand: UsernameCommand,
  space: ChannelAABB2D,
  playerEntities: Map<number, PlayerEntity>
) => {
  try {
    const viewSize = 1100;
    const newUser = new PlayerEntity(user, usernameCommand.username);
    newUser.x = 1;
    newUser.y = 1;
    // creates a local view for the playerEntity for network culling
    newUser.view = new AABB2D(0, 0, viewSize, viewSize);
    space.subscribe(user, newUser.view);
    space.addEntity(newUser); // assigns an nid to the playerEntity
    playerEntities.set(newUser.nid, newUser);
    user.queueMessage({
      myId: newUser.nid,
      ntype: NType.IdentityMessage,
      username: usernameCommand.username,
    });
    return newUser;
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

const createPhysicalObject = (object: ObjectEntity) => {
  const body = new p2.Body({
    mass: 10,
    position: [object.x, object.y],
    angle: object.rotation,
    damping: 0.99,
    angularDamping: 0.99,
    type: p2.Body.DYNAMIC,
  });

  const shape = new p2.Box({
    width: object.width,
    height: object.height,
  });

  shape.collisionGroup = 0x0002;
  shape.collisionMask = 0x0001;

  body.addShape(shape);
  return body;
};

export { createPlayerEntity, deletePlayerEntity, createPhysicalObject };
