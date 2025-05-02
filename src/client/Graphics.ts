import { Application, Container, Graphics, Sprite } from 'pixi.js';
//import TaggedTextPlus from 'pixi-tagged-text-plus';
import { PlayerEntity, ObjectEntity } from '@/common/types';

const createPlayerGraphics = (
  entity: PlayerEntity,
  worldContainer: Container,
  app: Application
) => {
  /*const playerSize = entity.size;
  //const fontSize = playerSize / 1.5;

  const playerContainer = new Container();
  playerContainer.x = entity.x;
  playerContainer.y = entity.y;

  const playerBody = new Graphics()
    .circle(0, 0, playerSize / 2)
    .fill({ color: entity.color, alpha: 1 });

  

 

  const playerNose = new Graphics()
    .moveTo(0, -playerSize / 2)
    .moveTo(0, -playerSize / 2)
    .lineTo(playerSize * 0.666, 0)
    .lineTo(0, playerSize / 2)
    .fill({ color: entity.color, alpha: 1 });
  playerNose.x = 3;
  playerNose.y = 0;

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
  username.position.set(-1, -fontSize / 2);
  username.width = playerSize;
  username.height = playerSize;
  username.alpha = 0.5;
  username.update();

  playerContainer.addChild(playerBody);
  playerContainer.addChild(playerNose);
  playerContainer.addChild(username);
  const playerGraphics = new Graphics()
    .circle(0, 0, playerSize * 100)
    .fill({ color: entity.color, alpha: 1 });
  const playerTexture = app.renderer.generateTexture(playerGraphics);

  const playerSprite = new Sprite(playerTexture);
  playerSprite.anchor.set(0.5);
  playerSprite.width = playerSize;
  playerSprite.height = playerSize;
  playerSprite.x = entity.x;
  playerSprite.y = entity.y;
  playerContainer.addChild(playerSprite);
  playerContainer.addChild(playerBody);
  entity.graphics = playerContainer;
  worldContainer.addChild(playerContainer);
  //app.stage.addChild(playerContainer);
  return playerContainer;*/
  console.log('player', entity);
  const playerGraphics = new Graphics()
    .circle(0, 0, entity.size * 100)
    .fill({ color: 0xff0000, alpha: 1 });
  const playerTexture = app.renderer.generateTexture(playerGraphics);

  const playerSprite = new Sprite(playerTexture);
  playerSprite.anchor.set(0.5);
  playerSprite.width = entity.size;
  playerSprite.height = entity.size;
  playerSprite.x = entity.x;
  playerSprite.y = entity.y;
  worldContainer.addChild(playerSprite);
  entity.graphics = playerSprite;
  return playerSprite;
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

export { createPlayerGraphics, createObjectGraphics };
