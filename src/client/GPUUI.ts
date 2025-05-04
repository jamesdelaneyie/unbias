import { Application, Container } from 'pixi.js';
import TaggedTextPlus from 'pixi-tagged-text-plus';
import { createGridGraphics } from '@/client/graphics/worldGraphics';

const drawBasicText = (masterContainer: Container, text: string, x: number, y: number) => {
  const taggedText = new TaggedTextPlus(text, {
    default: {
      fontSize: '24px',
      fill: '#fff',
      align: 'left',
    },
  });
  taggedText.x = x;
  taggedText.y = y;
  taggedText.label = 'World Title';
  masterContainer.addChild(taggedText);
};

const setupUI = (app: Application) => {
  const UserInterfaceContainer = new Container();
  UserInterfaceContainer.label = 'UserInterfaceContainer';
  UserInterfaceContainer.zIndex = 1000;
  app.stage.addChild(UserInterfaceContainer);

  drawBasicText(UserInterfaceContainer, 'BIAS 2.0', 10, 10);
};

const setupGraphicsWorld = (app: Application) => {
  const worldContainer = new Container();
  worldContainer.label = 'worldContainer';
  worldContainer.position.x = app.screen.width / 2;
  worldContainer.position.y = app.screen.height / 2;
  worldContainer.scale.x = 50;
  worldContainer.scale.y = -50;
  app.stage.addChild(worldContainer);

  createGridGraphics(app, worldContainer, 300);

  return worldContainer;
};

export { drawBasicText, setupUI, setupGraphicsWorld };
