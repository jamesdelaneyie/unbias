import '@pixi/layout';
// import { Client } from 'nengi';
import { Application, Container } from 'pixi.js'; //HTMLText, Text
import TaggedTextPlus from 'pixi-tagged-text-plus';
import { createGridGraphics } from '@/client/graphics/mapGraphics';
//import { LayoutContainer } from '@pixi/layout/components';
//import { ScrollBox } from '@pixi/ui';
//import { TextDecoration } from 'pixi-tagged-text-plus/dist/types';

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

  drawBasicText(UserInterfaceContainer, 'UNBIAS', 10, 10);

  UserInterfaceContainer.layout = {
    width: app.screen.width,
    height: app.screen.height,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    padding: 10,
  };
};

const setupGraphicsWorld = (app: Application) => {
  const worldContainer = new Container();
  worldContainer.label = 'worldContainer';
  worldContainer.position.x = app.screen.width / 2;
  worldContainer.position.y = app.screen.height / 2;
  worldContainer.scale.x = 10;
  worldContainer.scale.y = 10;
  app.stage.addChild(worldContainer);

  const gridGraphics = createGridGraphics({
    color: 0xffffff,
    width: 50,
    height: 50,
  });
  worldContainer.addChild(gridGraphics);

  return worldContainer;
};

/*
const aboutLinkText = 'About';
  const aboutLinkUnderlineText = '<underline>About</underline>';

  const aboutLink = new TaggedTextPlus(aboutLinkText, navLinkTextStyles, {
    drawWhitespace: true,
  });
  aboutLink.interactive = true;

  aboutLink.on('pointerover', function () {
    aboutLink.setText(aboutLinkUnderlineText);
  });

  aboutLink.on('pointerdown', function () {
    console.log('pointerdown');
  });
  aboutLink.on('pointerout', function () {
    aboutLink.setText(aboutLinkText);
  });

  textContainer.addChild(aboutLink);
  */

export { drawBasicText, setupUI, setupGraphicsWorld };
