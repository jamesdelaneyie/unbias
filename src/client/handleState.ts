import * as p2 from 'p2-es';
import { Binary, IEntity } from 'nengi';
import { Container, Application } from 'pixi.js';
import { IEntityMap, PlayerEntity, ObjectEntity } from '@/common/types';
import {
  createObjectGraphics,
  createPlayerGraphics,
  updatePlayerGraphics,
  updateObjectGraphics,
} from '@/client/Graphics';

const createPlayerEntity = (
  playerEntity: PlayerEntity,
  worldContainer: Container,
  app: Application,
  world: p2.World
) => {
  createPlayerGraphics(playerEntity, worldContainer, app);
  const body = new p2.Body({
    mass: 10,
    position: [playerEntity.x, playerEntity.y],
  });
  const circle = new p2.Circle({
    radius: playerEntity.size / 2,
  });

  body.addShape(circle);
  world.addBody(body);
  playerEntity.body = body;
};

const createObjectEntity = (
  objectEntity: ObjectEntity,
  worldContainer: Container,
  app: Application,
  world: p2.World
) => {
  createObjectGraphics(app, objectEntity, worldContainer);
  const body = new p2.Body({
    mass: 0.1, // Static body (doesn't move)
    position: [objectEntity.x, objectEntity.y],
    angle: objectEntity.rotation,
    velocity: [0, 0.6],
  });
  const circle = new p2.Circle({
    radius: objectEntity.width / 2,
  });

  body.addShape(circle);
  world.addBody(body);
  objectEntity.body = body;
};

const updatePlayerEntity = (diff: IEntity, worldState: any, entities: IEntityMap) => {
  if (diff.nid === worldState.myId) return;
  const player = entities.get(diff.nid);
  const property = diff.prop;
  const value = diff.value;
  if (player) {
    player[property] = value;
    if (!player.renderTarget) {
      player.renderTarget = { x: player.x, y: player.y, rotation: player.rotation };
    }
    player.renderTarget[property] = value;
  }
};

const updateObjectEntity = (diff: IEntity, entities: IEntityMap) => {
  const object = entities.get(diff.nid);
  if (object && object.graphics) {
    const property = diff.prop;
    const value = diff.value;
    if (property === 'rotation') {
      return;
    }
    if (object) {
      object[property] = value;
      if (property === 'x') {
        object.body.position[0] = value;
      }
      if (property === 'y') {
        object.body.position[1] = value;
      }
      if (!object.renderTarget) {
        object.renderTarget = { x: object.x, y: object.y, rotation: object.rotation };
      }
      object.renderTarget[property] = value;
    }
  }
};

const deletePlayer = (nid: Binary.UInt8, entities: IEntityMap) => {
  const player = entities.get(nid);
  if (player) {
    // Remove physics body if it exists
    if (player.body) {
      player.body.world.removeBody(player.body);
    }
    player.graphics?.destroy({ children: true });
    entities.delete(nid);
  }
};

export {
  updatePlayerEntity,
  updateObjectEntity,
  deletePlayer,
  updatePlayerGraphics,
  updateObjectGraphics,
  createPlayerEntity,
  createObjectEntity,
};
