import { Binary, IEntity } from 'nengi';
import { Container } from 'pixi.js';
import { Application } from 'pixi.js';
import * as p2 from 'p2-es';
import { IEntityMap, PlayerEntity, ObjectEntity } from '@/common/types';
import { worldConfig } from '@/common/worldConfig';
import { createObjectGraphics, createPlayerGraphics } from '@/client/Graphics';

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

const updatePlayerGraphics = (playerEntity: PlayerEntity, worldState: any, delta: number) => {
  if (playerEntity.nid === worldState.myId) return;
  if (!playerEntity.graphics || !playerEntity.renderTarget) return;
  const graphics = playerEntity.graphics;
  const t = Math.min(1, worldConfig.playerSmoothing * delta);
  graphics.x += (playerEntity.renderTarget.x - graphics.x) * t;
  graphics.y += (playerEntity.renderTarget.y - graphics.y) * t;
  graphics.rotation += (playerEntity.renderTarget.rotation - graphics.rotation) * t;
};

const updateObjectGraphics = (objectEntity: ObjectEntity, worldState: any, delta: number) => {
  if (!objectEntity.graphics || !objectEntity.renderTarget) return;
  const graphics = objectEntity.graphics;
  const t = Math.min(1, worldConfig.playerSmoothing * delta);
  graphics.x += (objectEntity.renderTarget.x - graphics.x) * t;
  graphics.y += (objectEntity.renderTarget.y - graphics.y) * t;
  //graphics.rotation += (objectEntity.renderTarget.rotation - graphics.rotation) * t;
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
