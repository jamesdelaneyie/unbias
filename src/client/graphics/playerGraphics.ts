import { Application, Container, Graphics, Sprite } from 'pixi.js';
import { PlayerEntity } from '@/common/types';
import TaggedTextPlus from 'pixi-tagged-text-plus';
import { worldConfig } from '@/common/worldConfig';

const createPlayerGraphics = (entity: PlayerEntity, app: Application) => {
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

export { createPlayerGraphics, updatePlayerGraphics };
