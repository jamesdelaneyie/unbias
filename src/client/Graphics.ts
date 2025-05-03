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
  playerContainer.label = 'player';
  if (entity.isSelf) {
    playerContainer.label += ' (self)';
  }
  playerContainer.interactive = false;
  playerContainer.x = entity.x;
  playerContainer.y = entity.y;

  const playerBodyContainer = new Container();
  playerBodyContainer.label = 'playerBodyContainer';
  playerBodyContainer.interactive = false;
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
  username.update();
  const usernameTexture = app.renderer.generateTexture(username);
  username.destroy();
  const usernameSprite = new Sprite(usernameTexture);
  usernameSprite.anchor.set(0.5);
  usernameSprite.scale.set(0.015);
  usernameSprite.scale.y *= -1;
  usernameSprite.x = 0;
  usernameSprite.y = -0.025;

  playerContainer.addChild(usernameSprite);
  return playerContainer;
};

const updatePlayerGraphics = (playerEntity: PlayerEntity, worldState: any, delta: number) => {
  //if (playerEntity.nid === worldState.myId) return;
  if (!playerEntity.renderTarget) return;
  const graphics = playerEntity.clientGraphics;
  const t = Math.min(1, worldConfig.playerSmoothing * delta);
  if (graphics) {
    graphics.x += (playerEntity.renderTarget.x - graphics.x) * t;
    graphics.y += (playerEntity.renderTarget.y - graphics.y) * t;
    graphics.rotation += (playerEntity.renderTarget.rotation - graphics.rotation) * t;
  }
  /*if (graphics) {
    graphics.x = playerEntity.x;
    graphics.y = playerEntity.y;
    graphics.rotation = playerEntity.rotation;
  }*/
  /**/
};

const createObjectGraphics = (
  app: Application,
  object: ObjectEntity,
  worldContainer: Container
) => {
  const objectContainer = new Container();
  objectContainer.label = 'object';
  const objectGraphics = new Graphics()
    .circle(0, 0, object.width * 100)
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
  //const t = Math.min(1, worldConfig.playerSmoothing * delta);
  //graphics.x += (objectEntity.renderTarget.x - graphics.x) * t;
  //graphics.y += (objectEntity.renderTarget.y - graphics.y) * t;
  //graphics.rotation += (objectEntity.renderTarget.rotation - graphics.rotation) * t;
  if (body) {
    graphics.x = body.position[0];
    graphics.y = body.position[1];
    graphics.rotation = body.angle;
  }
};

const createGridGraphics = (app: Application, worldContainer: Container, size: number) => {
  const gridContainer = new Container();
  gridContainer.label = 'gridContainer';
  gridContainer.interactive = false;
  gridContainer.x = 0;
  gridContainer.y = 0;
  const gridBorder = new Graphics()
    .rect(0, 0, size, size)
    .fill({ color: 0xffffff, alpha: 0.1 })
    .stroke({ color: 0xffffff, alpha: 0.6, width: 1 });
  gridContainer.addChild(gridBorder);
  const gridBorderTexture = app.renderer.generateTexture(gridBorder);
  gridBorder.destroy();

  const gridBorderSprite = new Sprite(gridBorderTexture);
  gridBorderSprite.anchor.set(0.5);
  gridBorderSprite.width = 10;
  gridBorderSprite.height = 10;
  gridContainer.addChild(gridBorderSprite);

  const gridLines = new Container();
  const gridLineSize = 20;
  for (let i = 0; i < size / gridLineSize; i++) {
    let line = new Graphics();
    line.moveTo(i * gridLineSize, 0);
    line.lineTo(i * gridLineSize, size);
    line.stroke({ color: 0xffffff, alpha: 0.3, width: 1 });
    gridLines.addChild(line);
  }

  for (let i = 0; i < size / gridLineSize; i++) {
    let line = new Graphics();
    line.moveTo(0, i * gridLineSize);
    line.lineTo(size, i * gridLineSize);
    line.stroke({ color: 0xffffff, alpha: 0.3, width: 1 });
    gridLines.addChild(line);
  }
  const gridLinesTexture = app.renderer.generateTexture(gridLines);
  gridLines.destroy();

  const gridLinesSprite = new Sprite(gridLinesTexture);
  gridLinesSprite.anchor.set(0.5);
  gridLinesSprite.width = 10;
  gridLinesSprite.height = 10;
  gridContainer.addChild(gridLinesSprite);

  worldContainer.addChild(gridContainer);
};

export {
  createPlayerGraphics,
  createObjectGraphics,
  updatePlayerGraphics,
  updateObjectGraphics,
  createGridGraphics,
};
