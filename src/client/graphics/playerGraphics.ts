import { Container, Graphics, Sprite } from 'pixi.js';
import { PlayerEntity } from '@/common/types';
import TaggedTextPlus from 'pixi-tagged-text-plus';
import { config } from '@/common/config';

const createPlayerGraphics = (entity: PlayerEntity) => {
  // @ts-ignore Access PIXI app from global context
  const app = globalThis.__PIXI_APP__;
  const playerSize = entity.size;

  const playerContainer = new Container();
  playerContainer.label = 'player';
  playerContainer.zIndex = 2;
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
    .fill({ color: 0xffffff, alpha: 1 });

  const playerBodyTexture = app.renderer.generateTexture(playerBody);
  const playerBodySprite = new Sprite(playerBodyTexture);
  playerBodySprite.label = 'playerBody';
  playerBodySprite.tint = entity.color;
  playerBodySprite.anchor.set(0.5);
  playerBodySprite.width = entity.size;
  playerBodySprite.height = entity.size;
  playerBodyContainer.addChild(playerBodySprite);

  const playerNose = new Graphics()
    .moveTo(0, (-playerSize / 2) * 100)
    .lineTo(playerSize * 0.666 * 100, 0)
    .lineTo(0, (playerSize / 2) * 100)
    .fill({ color: 0xffffff, alpha: 1 });

  const playerNoseTexture = app.renderer.generateTexture(playerNose);

  const playerNoseSprite = new Sprite(playerNoseTexture);
  playerNoseSprite.label = 'playerNose';
  playerNoseSprite.tint = entity.color;
  playerNoseSprite.anchor.set(0.5);
  playerNoseSprite.width = 3;
  playerNoseSprite.height = 4;
  playerNoseSprite.x = 3;
  playerNoseSprite.y = 0;
  playerBodyContainer.addChild(playerNoseSprite);

  const fontSize = playerSize * 50;
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
          color: 'transparent',
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
  usernameSprite.label = 'username';
  usernameSprite.anchor.set(0.5);
  usernameSprite.scale.set(0.015);
  usernameSprite.x = 0;
  usernameSprite.y = -0.025;

  playerContainer.addChild(usernameSprite);
  return playerContainer;
};

const updateRemotePlayerGraphics = (playerEntity: PlayerEntity, delta: number) => {
  const graphics = playerEntity.clientGraphics;
  if (!graphics || !playerEntity.renderTarget) return;
  const t = Math.min(1, config.playerSmoothing * delta);
  graphics.x += (playerEntity.renderTarget.x - graphics.x) * t;
  graphics.y += (playerEntity.renderTarget.y - graphics.y) * t;
  const playerBodyContainer = graphics.getChildByLabel('playerBodyContainer');
  if (playerBodyContainer) {
    const targetRotation = playerEntity.renderTarget.rotation;
    const currentRotation = playerBodyContainer.rotation;
    // Handle angle wrapping for smooth interpolation
    let diff = targetRotation - currentRotation;
    while (diff < -Math.PI) diff += 2 * Math.PI;
    while (diff > Math.PI) diff -= 2 * Math.PI;
    playerBodyContainer.rotation = playerEntity.rotation; //+= diff * t;
    const playerBody = playerBodyContainer.getChildByLabel('playerBody');
    const playerNose = playerBodyContainer.getChildByLabel('playerNose');
    const username = graphics.getChildByLabel('username');
    if (playerEntity.isAlive === false) {
      if (playerBody) {
        playerBody.tint = 0xff0000;
      }
      if (playerNose) {
        playerNose.tint = 0xff0000;
      }
      if (username) {
        username.alpha = 0.5;
      }
    }
  }
};

const updateLocalPlayerServerGraphics = (playerEntity: PlayerEntity) => {
  const graphics = playerEntity.serverGraphics;
  if (!graphics) return;
  graphics.x = playerEntity.x;
  graphics.y = playerEntity.y;
  const playerBodyContainer = graphics.getChildByLabel('playerBodyContainer');
  if (playerBodyContainer) {
    playerBodyContainer.rotation = playerEntity.rotation;
  }
};

const updateLocalPlayerGraphicsWithPrediction = (
  playerEntity: PlayerEntity,
  prediction: any,
  delta: number
) => {
  const graphics = playerEntity.clientGraphics;
  if (!graphics) return;
  // t is the interpolation factor
  const t = Math.min(1, config.playerSmoothing * delta);
  graphics.x += (prediction.x - graphics.x) * t;
  graphics.y += (prediction.y - graphics.y) * t;
  const playerBodyContainer = graphics.getChildByLabel('playerBodyContainer');
  if (playerBodyContainer) {
    const targetRotation = prediction.rotation;
    const currentRotation = playerBodyContainer.rotation;
    // Handle angle wrapping for smooth interpolation
    // ensures the graphics dont flip back to 0 when the value goes over 360
    let diff = targetRotation - currentRotation;
    while (diff < -Math.PI) diff += 2 * Math.PI;
    while (diff > Math.PI) diff -= 2 * Math.PI;
    playerBodyContainer.rotation += diff * t;
  }
};

export {
  createPlayerGraphics,
  updateRemotePlayerGraphics,
  updateLocalPlayerGraphicsWithPrediction,
  updateLocalPlayerServerGraphics,
};

/*
const ligtenColor = (color: number, amount: number) => {
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;

  const newR = Math.min(255, r + (255 - r) * amount);
  const newG = Math.min(255, g + (255 - g) * amount);
  const newB = Math.min(255, b + (255 - b) * amount);

  return (newR << 16) + (newG << 8) + newB;
};
*/
