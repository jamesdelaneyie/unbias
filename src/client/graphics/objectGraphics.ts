import { Application, Container, Graphics, Sprite } from 'pixi.js';
import { ObjectEntity } from '@/common/types';
//import { worldConfig } from '@/common/worldConfig';

const createObjectGraphics = (
  app: Application,
  object: ObjectEntity,
  worldContainer: Container
) => {
  const objectContainer = new Container();
  objectContainer.label = 'object';

  const objectGraphics = new Graphics()
    .rect(0, 0, object.width, object.height)
    .fill({ color: 0xffffff, alpha: 1 });
  const objectTexture = app.renderer.generateTexture(objectGraphics);
  objectGraphics.destroy();

  const objectSprite = new Sprite(objectTexture);
  objectSprite.anchor.set(0.5);
  objectSprite.width = object.width;
  objectSprite.height = object.height;
  objectSprite.x = object.x;
  objectSprite.y = object.y;
  objectSprite.rotation = object.rotation;
  objectContainer.addChild(objectSprite);
  worldContainer.addChild(objectContainer);
  return objectSprite;
};

const updateObjectGraphics = (objectEntity: ObjectEntity) => {
  if (!objectEntity.clientGraphics || !objectEntity.renderTarget) return;
  const graphics = objectEntity.clientGraphics;
  const body = objectEntity.body;
  if (body && graphics) {
    graphics.x = objectEntity.x;
    graphics.y = objectEntity.y;
    graphics.rotation = objectEntity.rotation;
    graphics.tint = objectEntity.color;
    /*const t = Math.min(1, worldConfig.objectSmoothing * delta);
    graphics.x += (body.position[0] - graphics.x) * t;
    graphics.y += (body.position[1] - graphics.y) * t;
    graphics.rotation += (body.angle - graphics.rotation) * t;
    ;*/
  }
};

export { createObjectGraphics, updateObjectGraphics };
