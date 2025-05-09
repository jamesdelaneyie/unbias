import { User, AABB2D, ChannelAABB2D } from 'nengi';
import { PlayerEntity } from '../common/PlayerEntity';
import { NType } from '../common/NType';
import { ObjectEntity, UsernameCommand } from '../common/types';
import * as p2 from 'p2-es';

const createPlayerEntity = (
  user: User,
  usernameCommand: UsernameCommand,
  main: ChannelAABB2D,
  playerEntities: Map<number, PlayerEntity>
) => {
  try {
    const viewSize = 1100;
    const newUser = new PlayerEntity(user, usernameCommand.username);
    newUser.x = 1;
    newUser.y = 1;
    // creates a local view for the playerEntity for network culling
    newUser.view = new AABB2D(0, 0, viewSize, viewSize);
    main.subscribe(user, newUser.view);
    main.addEntity(newUser); // assigns an nid to the playerEntity
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
