import * as p2 from 'p2-es';
import { Binary, IEntity } from 'nengi';
import { Container, Application } from 'pixi.js';
import { IEntityMap, PlayerEntity, ObjectEntity, PlayerEntityMap } from '@/common/types';
import { createPlayerGraphics } from '@/client/graphics/playerGraphics';
import { createObjectGraphics } from '@/client/graphics/objectGraphics';

const createPlayerEntity = (
  playerEntity: PlayerEntity,
  worldContainer: Container,
  app: Application,
  world: p2.World
) => {
  const clientGraphics = createPlayerGraphics(playerEntity, app);
  playerEntity.clientGraphics = clientGraphics;
  worldContainer.addChild(clientGraphics);
  let serverGraphics = null;
  if (playerEntity.isSelf) {
    serverGraphics = createPlayerGraphics(playerEntity, app);
    playerEntity.serverGraphics = serverGraphics;
    serverGraphics.visible = false;
    worldContainer.addChild(serverGraphics);
  }
  let bodyType = p2.Body.KINEMATIC;
  let playerMass = 0;
  if (playerEntity.isSelf) {
    //@ts-ignore type error in p2-es
    bodyType = p2.Body.DYNAMIC;
    playerMass = 10;
  }
  const playerBody = new p2.Body({
    mass: playerMass,
    position: [playerEntity.x, playerEntity.y],
    type: bodyType,
  });
  const playerShape = new p2.Circle({
    radius: playerEntity.size / 2,
  });
  playerShape.collisionGroup = 0x0001;
  playerShape.collisionMask = 0x0002;
  playerEntity.body = playerBody;

  playerBody.addShape(playerShape);
  world.addBody(playerBody);
};

const updatePlayerEntity = (diff: IEntity, worldState: any, entities: IEntityMap) => {
  const player = entities.get(diff.nid);
  if (!player) return;

  const property = diff.prop;
  const value = diff.value;

  if (diff.nid === worldState.myId) {
    if (property !== 'x' && property !== 'y' && property !== 'rotation') {
      player[property] = value;
      if (player.serverGraphics) {
        player.serverGraphics[property] = value;
      }
    }
  } else {
    player[property] = value;
    if (!player.renderTarget) {
      player.renderTarget = { x: player.x, y: player.y, rotation: player.rotation };
    }
    player.renderTarget[property] = value;

    const playerBody = player.body;
    if (playerBody) {
      if (property === 'x') {
        playerBody.position[0] = value;
      }
      if (property === 'y') {
        playerBody.position[1] = value;
      }
      if (property === 'rotation') {
        playerBody.angle = value;
      }
    }
  }
};

const deletePlayerEntity = (nid: Binary.UInt8, playerEntities: PlayerEntityMap) => {
  const player = playerEntities.get(nid);
  if (player) {
    if (player.body) {
      player.body.world?.removeBody(player.body);
    }
    player.clientGraphics?.destroy({ children: true });
    player.serverGraphics?.destroy({ children: true });
    playerEntities.delete(nid);
  }
};

const createObjectEntity = (
  objectEntity: ObjectEntity,
  worldContainer: Container,
  app: Application,
  world: p2.World
) => {
  const objectGraphics = createObjectGraphics(app, objectEntity, worldContainer);
  const objectBody = new p2.Body({
    mass: 0.1,
    position: [objectEntity.x, objectEntity.y],
    angle: objectEntity.rotation,
    damping: 0.99,
    angularDamping: 0.99,
  });
  const objectShape = new p2.Box({
    width: objectEntity.width,
    height: objectEntity.height,
  });
  objectShape.collisionGroup = 0x0002;
  objectShape.collisionMask = 0x0001;

  objectBody.addShape(objectShape);
  world.addBody(objectBody);

  objectEntity.body = objectBody;
  objectEntity.graphics = objectGraphics;

  objectEntity.renderTarget = {
    x: objectEntity.x,
    y: objectEntity.y,
    rotation: objectEntity.rotation,
  };
};

const updateObjectEntity = (diff: IEntity, entities: IEntityMap) => {
  const object = entities.get(diff.nid);
  if (object && object.graphics) {
    const property = diff.prop;
    const value = diff.value;
    if (object) {
      object[property] = value;
      if (object.body) {
        if (property === 'x') {
          object.body.position[0] = value;
        }
        if (property === 'y') {
          object.body.position[1] = value;
        }
        if (property === 'rotation') {
          object.body.angle = value;
        }
      }
      if (!object.renderTarget) {
        object.renderTarget = { x: object.x, y: object.y, rotation: object.rotation };
      }
      object.renderTarget[property] = value;
    }
  }
};

export {
  createPlayerEntity,
  updatePlayerEntity,
  deletePlayerEntity,
  createObjectEntity,
  updateObjectEntity,
};
