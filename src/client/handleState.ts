import { Binary, IEntity } from 'nengi';
import { IEntityMap, PlayerEntity, ObjectEntity } from '@/common/types';
import { worldConfig } from '@/common/worldConfig';

const updatePlayerEntity = (diff: IEntity, worldState: any, entities: IEntityMap) => {
  if (diff.nid === worldState.myRawId) return;
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
  if (objectEntity.nid === worldState.myId) return;
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
};
