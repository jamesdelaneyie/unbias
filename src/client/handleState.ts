import { Sprite } from 'pixi.js';
import { EntityMap } from './client';

const updatePlayer = (entity: any, entities: EntityMap) => {
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

const updateObject = (entity: any, entities: EntityMap) => {
  const object = entities.get(entity.nid) as Sprite;
  if (object) {
    const property = entity.prop;
    const value = entity.value;
    if (property === 'x') {
      object.position.set(value, object.position.y);
    }
    if (property === 'y') {
      object.position.set(object.position.x, value);
    }
  }
};

const deletePlayer = (nid: number, entities: EntityMap) => {
  const player = entities.get(nid);
  if (player) {
    player.parent?.removeChild(player);
    player.destroy({ children: true });
    entities.delete(nid);
  }
};

export { updatePlayer, updateObject, deletePlayer };
