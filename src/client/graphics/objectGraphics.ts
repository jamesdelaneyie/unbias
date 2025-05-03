import { Application, Container, Graphics, Sprite } from 'pixi.js';
import { ObjectEntity } from '@/common/types';

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
  objectContainer.addChild(objectSprite);
  worldContainer.addChild(objectContainer);
  object.graphics = objectSprite;
  return objectSprite;
};

const updateObjectGraphics = (objectEntity: ObjectEntity) => {
  if (!objectEntity.graphics || !objectEntity.renderTarget) return;
  const graphics = objectEntity.graphics;
  const body = objectEntity.body;
  if (body) {
    graphics.x = body.position[0];
    graphics.y = body.position[1];
    graphics.rotation = body.angle;
  }
};

export { createObjectGraphics, updateObjectGraphics };
