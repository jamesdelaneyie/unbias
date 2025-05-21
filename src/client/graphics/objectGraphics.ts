import { Container, Graphics, Sprite } from 'pixi.js';
import { ObjectEntity } from '@/common/types';

const createObjectGraphics = (object: any) => {
  // @ts-ignore Access PIXI app from global context
  const app = globalThis.__PIXI_APP__;

  const objectContainer = new Container();
  objectContainer.label = object.label;

  const objectGraphics = new Graphics();

  const objectColor = object.color ?? 0xffffff;

  if (object.shape === 'rectangle') {
    objectGraphics
      .rect(0, 0, object.width * 10, object.height * 10)
      .fill({ color: objectColor, alpha: 1 });
    if (object.stroke) {
      objectGraphics.stroke({ color: object.stroke, alpha: 1, width: 1, pixelLine: true });
    }
  } else if (object.shape === 'circle') {
    objectGraphics.circle(0, 0, object.radius * 10).fill({ color: objectColor, alpha: 1 });
    if (object.stroke) {
      objectGraphics.stroke({ color: object.stroke, alpha: 1, width: 1, pixelLine: true });
    }
  } else if (object.shape === 'capsule') {
    objectGraphics
      .roundRect(0, 0, object.width * 10, object.height * 10, object.radius * 10)
      .fill({ color: objectColor, alpha: 1 });
    if (object.stroke) {
      objectGraphics.stroke({ color: object.stroke, alpha: 1, width: 1, pixelLine: true });
    }
  } else if (object.shape === 'polygon') {
    if (object.vertices.length > 0) {
      const scaledVertices = JSON.parse(object.vertices).map(([x, y]: [number, number]) => [
        x * 10,
        y * 10,
      ]);
      const points = scaledVertices.flatMap(([x, y]: [number, number]) => [x, y]);
      objectGraphics.poly(points, true).fill({ color: objectColor, alpha: 1 });
      if (object.stroke) {
        objectGraphics.stroke({ color: object.stroke, alpha: 1, width: 1, pixelLine: true });
      }
    }
  }

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
  return { objectSprite, objectContainer };
};

const updateObjectGraphics = (objectEntity: ObjectEntity) => {
  if (!objectEntity.clientGraphics || !objectEntity.renderTarget) return;
  const graphics = objectEntity.clientGraphics;
  const body = objectEntity.body;
  if (body && graphics) {
    //console.log('updateObjectGraphics', objectEntity.x, objectEntity.y, objectEntity.rotation);
    graphics.x = objectEntity.x;
    graphics.y = objectEntity.y;
    graphics.rotation = objectEntity.rotation;
    graphics.tint = objectEntity.color;
    /*const t = Math.min(1, config.objectSmoothing * delta);
    graphics.x += (body.position[0] - graphics.x) * t;
    graphics.y += (body.position[1] - graphics.y) * t;
    graphics.rotation += (body.angle - graphics.rotation) * t;
    ;*/
  }
};

export { createObjectGraphics, updateObjectGraphics };
