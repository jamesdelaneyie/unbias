import { Binary, IEntity } from 'nengi';
import { IEntityMap, PlayerEntity } from '@/common/types';
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

const updateObject = (entity: IEntity, entities: IEntityMap) => {
  const object = entities.get(entity.nid);
  if (object && object.graphics) {
    const property = entity.prop;
    const value = entity.value;
    if (property === 'x') {
      object.graphics.position.set(value, object.graphics.position.y);
    }
    if (property === 'y') {
      object.graphics.position.set(object.graphics.position.x, value);
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

export { updatePlayerEntity, updateObject, deletePlayer, updatePlayerGraphics };
