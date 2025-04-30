import { Application, Container, Graphics, Sprite } from 'pixi.js';
import TaggedTextPlus from 'pixi-tagged-text-plus';
import { ligtenColor } from './UIUtils';

type EntityMap = Map<number, Container>;

const createPlayerGraphics = (entity: any, app: Application, entities: EntityMap) => {
  const playerSize = entity.size;
  const fontSize = playerSize / 1.5;
  const playerContainer = new Container();
  const playerBody = new Graphics()
    .circle(0, 0, playerSize / 2)
    .fill({ color: entity.color, alpha: 1 })
    .stroke({ color: ligtenColor(entity.color, 0.2), width: 1 });
  playerContainer.x = entity.x;
  playerContainer.y = entity.y;
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
  username.update();
  playerContainer.addChild(playerBody);
  playerContainer.addChild(username);
  app.stage.addChild(playerContainer);
  entities.set(entity.nid, playerContainer);
};

const createObjectGraphics = (
  app: Application,
  object: any,
  worldContainer: Container,
  entities: EntityMap
) => {
  console.log(object);
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

  entities.set(object.nid, objectSprite);
};

export { createPlayerGraphics, createObjectGraphics };
