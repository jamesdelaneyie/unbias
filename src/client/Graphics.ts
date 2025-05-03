import { PlayerEntity, ObjectEntity } from '@/common/types';
import { Application, Container, Graphics, Sprite } from 'pixi.js';
import TaggedTextPlus from 'pixi-tagged-text-plus';
import { worldConfig } from '@/common/worldConfig';

const createPlayerGraphics = (
  entity: PlayerEntity,
  worldContainer: Container,
  app: Application
) => {
  const playerSize = entity.size;

  const playerContainer = new Container();
  playerContainer.x = entity.x;
  playerContainer.y = entity.y;

  const playerBodyContainer = new Container();
  playerBodyContainer.label = 'playerBodyContainer';
  playerContainer.addChild(playerBodyContainer);

  const playerBody = new Graphics()
    .circle(0, 0, playerSize * 100)
    .fill({ color: entity.color, alpha: 1 });

  const playerBodyTexture = app.renderer.generateTexture(playerBody);
  const playerBodySprite = new Sprite(playerBodyTexture);
  playerBodySprite.anchor.set(0.5);
  playerBodySprite.width = entity.size;
  playerBodySprite.height = entity.size;
  playerBodyContainer.addChild(playerBodySprite);

  const playerNose = new Graphics()
    .moveTo(0, (-playerSize / 2) * 100)
    .lineTo(playerSize * 0.666 * 100, 0)
    .lineTo(0, (playerSize / 2) * 100)
    .fill({ color: entity.color, alpha: 1 });

  const playerNoseTexture = app.renderer.generateTexture(playerNose);

  const playerNoseSprite = new Sprite(playerNoseTexture);
  playerNoseSprite.anchor.set(0.5);
  playerNoseSprite.width = 0.6;
  playerNoseSprite.height = 0.9;
  playerNoseSprite.x = 0.5;
  playerNoseSprite.y = 0;
  playerBodyContainer.addChild(playerNoseSprite);

  const fontSize = 50;
  const username = new TaggedTextPlus(
    entity.username.slice(0, 1).toUpperCase(),
    {
      default: {
        fontSize: fontSize,
        fill: '#fff',
        align: 'center',
        wordWrap: true,
        wordWrapWidth: 2,
        stroke: {
          color: '#000',
          width: 0,
        },
      },
    },
    { skipUpdates: true }
  );
  username.x = 0;
  username.y = 0;
  username.alpha = 1;
  username.update();

  const usernameTexture = app.renderer.generateTexture(username);
  const usernameSprite = new Sprite(usernameTexture);
  usernameSprite.anchor.set(0.5);
  usernameSprite.scale.set(0.015);
  usernameSprite.scale.y *= -1;

  playerContainer.addChild(usernameSprite);

  entity.graphics = playerContainer;
  worldContainer.addChild(playerContainer);
  return playerContainer;
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

const createObjectGraphics = (
  app: Application,
  object: ObjectEntity,
  worldContainer: Container
) => {
  const objectGraphics = new Graphics()
    .circle(0, 0, object.width * 100)
    .fill({ color: 0xffffff, alpha: 1 });
  const objectTexture = app.renderer.generateTexture(objectGraphics);

  const objectSprite = new Sprite(objectTexture);
  objectSprite.anchor.set(0.5);
  objectSprite.width = object.width;
  objectSprite.height = object.height;
  objectSprite.x = object.x;
  objectSprite.y = object.y;
  worldContainer.addChild(objectSprite);
  object.graphics = objectSprite;
  return objectSprite;
};

const updateObjectGraphics = (objectEntity: ObjectEntity, delta: number) => {
  if (!objectEntity.graphics || !objectEntity.renderTarget) return;
  const graphics = objectEntity.graphics;
  const body = objectEntity.body;
  const t = Math.min(1, worldConfig.playerSmoothing * delta);
  graphics.x += (objectEntity.renderTarget.x - graphics.x) * t;
  graphics.y += (objectEntity.renderTarget.y - graphics.y) * t;
  graphics.rotation += (objectEntity.renderTarget.rotation - graphics.rotation) * t;
  if (body) {
    graphics.x = body.position[0];
    graphics.y = body.position[1];
    graphics.rotation = body.angle;
  }
};

export { createPlayerGraphics, createObjectGraphics, updatePlayerGraphics, updateObjectGraphics };
