import * as p2 from 'p2-es';
import { Binary, IEntity } from 'nengi';
import { Container, Application } from 'pixi.js';
import {
  IEntityMap,
  PlayerEntity,
  ObjectEntity,
  PlayerEntityMap,
  ObjectEntityMap,
} from '@/common/types';
import { createPlayerGraphics } from '@/client/graphics/playerGraphics';
import { createObjectGraphics } from '@/client/graphics/objectGraphics';
import { NetworkType } from '@/common/NetworkType';
import { DynamicObject, StaticObject } from '@/common/ObjectEntity';

const createPlayerEntity = (
  playerEntity: PlayerEntity,
  worldContainer: Container,
  app: Application,
  world: p2.World
) => {
  let serverGraphics = null;
  if (playerEntity.isSelf) {
    serverGraphics = createPlayerGraphics(playerEntity);
    playerEntity.serverGraphics = serverGraphics;
    serverGraphics.tint = 0x0000ff;
    worldContainer.addChild(serverGraphics);
  }
  const clientGraphics = createPlayerGraphics(playerEntity);
  playerEntity.clientGraphics = clientGraphics;
  worldContainer.addChild(clientGraphics);

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
    ccdSpeedThreshold: 1,
    ccdIterations: 20,
  });
  const playerShape = new p2.Circle({
    radius: playerEntity.size / 2,
  });
  const noseVertices = [
    [0, -playerEntity.size / 2],
    [playerEntity.size * 0.8666, 0],
    [0, playerEntity.size / 2],
  ];
  const noseShape = new p2.Convex({
    vertices: noseVertices,
    position: [playerEntity.x, playerEntity.y],
  });
  playerBody.addShape(noseShape);

  playerEntity.body = playerBody;
  playerEntity.renderTarget = {
    x: playerEntity.x,
    y: playerEntity.y,
    rotation: playerEntity.rotation,
  };

  playerBody.addShape(playerShape);
  world.addBody(playerBody);
};

const updatePlayerEntity = (diff: IEntity, worldState: any, entities: IEntityMap) => {
  const property = diff.prop;
  const value = diff.value;

  const player = entities.get(diff.nid);
  if (!player) return;

  if (diff.nid === worldState.myId) {
    if (property === 'x') {
      player.body.position[0] = value;
    }
    if (property === 'y') {
      player.body.position[1] = value;
    }
    if (property === 'rotation') {
      player.rotation = value;
    }
    if (property === 'color') {
      player.color = value;
    }
    if (property === 'isAlive') {
      player.isAlive = value;
    }
    return;
  }

  player[property] = value;
  player.renderTarget[property] = value;
  if (property === 'x') {
    player.body.position[0] = value;
  }
  if (property === 'y') {
    player.body.position[1] = value;
  }
  if (property === 'rotation') {
    player.body.angle = value;
  }
  if (property === 'color') {
    player.color = value;
  }
  if (property === 'isAlive') {
    player.isAlive = value;
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

const isPredictionDifferentToCurrentState = (prediction: any, currentState: any) => {
  return (
    prediction.x !== currentState.x ||
    prediction.y !== currentState.y ||
    prediction.rotation !== currentState.rotation
  );
};

const createObjectEntity = (
  objectEntity: ObjectEntity,
  worldContainer: Container,
  app: Application,
  world: p2.World
) => {
  const objectBody = new p2.Body({
    mass: objectEntity.mass,
    position: [objectEntity.x, objectEntity.y],
    angle: objectEntity.rotation,
    angularVelocity: 1,
    damping: 0.97,
    angularDamping: 0.999,
    type: objectEntity.bodyType,
  });
  const objectShape = new p2.Box({
    width: objectEntity.width,
    height: objectEntity.height,
  });
  console.log('checker');

  const { objectSprite, objectContainer } = createObjectGraphics(objectEntity);
  objectEntity.clientGraphics = objectSprite;
  worldContainer.addChild(objectContainer);
  objectBody.addShape(objectShape);
  world.addBody(objectBody);

  objectEntity.body = objectBody;

  objectEntity.renderTarget = {
    x: objectEntity.x,
    y: objectEntity.y,
    rotation: objectEntity.rotation,
  };
};

const createStaticObjectEntity = (
  objectEntity: ObjectEntity,
  worldContainer: Container,
  app: Application,
  world: p2.World
) => {
  const object = new StaticObject(objectEntity);
  const { objectSprite, objectContainer } = createObjectGraphics(object);
  objectEntity.clientGraphics = objectSprite;
  worldContainer.addChild(objectContainer);
  world.addBody(object.body);
  return object;
  /*const objectBody = new p2.Body({
    mass: objectEntity.mass,
    position: [objectEntity.x, objectEntity.y],
    angle: objectEntity.rotation,
    angularVelocity: 1,
    damping: 0.97,
    angularDamping: 0.999,
    type: objectEntity.bodyType,
  });
  const objectShape = new p2.Box({
    width: objectEntity.width,
    height: objectEntity.height,
  });
  console.log('checker');

  const { objectSprite, objectContainer } = createObjectGraphics(objectEntity);
  objectEntity.clientGraphics = objectSprite;
  worldContainer.addChild(objectContainer);
  objectBody.addShape(objectShape);
  world.addBody(objectBody);

  objectEntity.body = objectBody;

  objectEntity.renderTarget = {
    x: objectEntity.x,
    y: objectEntity.y,
    rotation: objectEntity.rotation,
  };*/
};

const createDynamicObjectEntity = (
  objectEntity: ObjectEntity,
  worldContainer: Container,
  //app: Application,
  world: p2.World
) => {
  const object = new DynamicObject(objectEntity);
  const { objectSprite, objectContainer } = createObjectGraphics(object);

  //@ts-ignore
  object.clientGraphics = objectSprite;
  //@ts-ignore
  object.renderTarget = {
    x: objectEntity.x,
    y: objectEntity.y,
    rotation: objectEntity.rotation,
  };
  worldContainer.addChild(objectContainer);
  world.addBody(object.body);
  return object;
};

const updateObjectEntity = (diff: IEntity, entities: ObjectEntityMap) => {
  const object = entities.get(diff.nid);
  if (!object) return;

  const property = diff.prop;
  const value = diff.value;

  // Update base entity property
  // @ts-ignore for the moment
  object[property] = value;

  // Update renderTarget
  // @ts-ignore for the moment
  object.renderTarget[property] = value;

  // Update physics body
  if (object.body) {
    if (property === 'x') {
      object.body.position[0] = value;
    } else if (property === 'y') {
      object.body.position[1] = value;
    } else if (property === 'rotation') {
      object.body.angle = value;
    }
  }
};

interface IEntityFrame {
  createEntities: IEntity[];
  updateEntities: any[];
  deleteEntities: number[];
}

const updateLocalStates = (
  istate: any,
  worldState: any,
  worldContainer: Container,
  app: Application,
  world: p2.World,
  entities: IEntityMap,
  playerEntities: PlayerEntityMap,
  objectEntities: ObjectEntityMap
) => {
  istate.forEach((snapshot: IEntityFrame) => {
    snapshot.createEntities.forEach((entity: IEntity) => {
      if (entity.ntype === NetworkType.PlayerEntity) {
        const playerEntity = entity as PlayerEntity;
        playerEntity.isSelf = playerEntity.nid === worldState.myId;
        entities.set(entity.nid, entity);
        playerEntities.set(entity.nid, playerEntity);
        createPlayerEntity(playerEntity, worldContainer, app, world);
        console.log('player entity', playerEntity);
      } else if (entity.ntype === NetworkType.StaticObject) {
        console.log('static object');
        const objectEntity = entity as ObjectEntity;
        entities.set(entity.nid, entity);
        objectEntities.set(entity.nid, objectEntity);
        createStaticObjectEntity(objectEntity, worldContainer, app, world);
      } else if (entity.ntype === NetworkType.DynamicObject) {
        const objectEntity = entity as ObjectEntity;
        const object = createDynamicObjectEntity(objectEntity, worldContainer, world);
        entities.set(entity.nid, object);
        //@ts-ignore
        objectEntities.set(entity.nid, object);
      }
    });

    snapshot.updateEntities.forEach((diff: IEntity) => {
      updatePlayerEntity(diff, worldState, playerEntities);
      updateObjectEntity(diff, objectEntities);
    });

    snapshot.deleteEntities.forEach((nid: number) => {
      deletePlayerEntity(nid, playerEntities);
    });
  });
};

export {
  createPlayerEntity,
  updatePlayerEntity,
  deletePlayerEntity,
  createObjectEntity,
  updateObjectEntity,
  isPredictionDifferentToCurrentState,
  updateLocalStates,
};
