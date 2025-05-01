import { Binary, IEntity } from 'nengi';
import { IEntityMap } from '@/common/types';

const updatePlayer = (entity: IEntity, entities: IEntityMap) => {
  const playerGraphics = entities.get(entity.nid)?.graphics;
  const property = entity.prop;
  const value = entity.value;
  if (playerGraphics) {
    if (property === 'x') {
      playerGraphics.x = value;
    }
    if (property === 'y') {
      playerGraphics.y = value;
    }
    if (property === 'rotation') {
      playerGraphics.rotation = value;
    }
  }
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

export { updatePlayer, updateObject, deletePlayer };
