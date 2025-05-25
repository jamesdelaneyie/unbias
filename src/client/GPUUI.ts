import '@pixi/layout';
import { Application, Container } from 'pixi.js';
import TaggedTextPlus from 'pixi-tagged-text-plus';
import { TextDecoration } from 'pixi-tagged-text-plus/dist/types';
import { createGridGraphics } from '@/client/graphics/mapGraphics';
import { config } from '@/common/config';
import { Viewport } from 'pixi-viewport';

const drawLinkText = (container: Container, text: string, href: string, x: number, y: number) => {
  const underline: TextDecoration = 'underline';
  const navLinkTextStyles = {
    default: {
      fill: '#fff',
    },
    underline: {
      fill: '#ffffff',
      textDecoration: underline,
      underlineColor: '#ffffff',
      underlineThickness: 1,
      underlineOffset: 1,
    },
  };

  const linkText = text;
  const linkTextUnderlined = '<underline>' + text + '</underline>';

  const link = new TaggedTextPlus(linkText, navLinkTextStyles, {
    drawWhitespace: true,
  });
  link.x = x;
  link.y = y;
  link.interactive = true;
  link.cursor = 'pointer';

  link.on('pointerover', function () {
    link.setText(linkTextUnderlined);
  });
  link.on('pointerout', function () {
    link.setText(linkText);
  });

  link.on('pointerdown', function () {
    window.open(href, '_blank');
  });

  container.addChild(link);
};

const setupUI = (app: Application) => {
  const UserInterfaceContainer = new Container();
  UserInterfaceContainer.label = 'UserInterfaceContainer';
  UserInterfaceContainer.zIndex = 1000;
  app.stage.addChild(UserInterfaceContainer);

  drawLinkText(UserInterfaceContainer, 'UNBIAS', config.repoLink, 10, 10);

  UserInterfaceContainer.layout = {
    width: app.screen.width,
    height: app.screen.height,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    padding: 10,
  };

  return UserInterfaceContainer;
};

const setupGraphicsWorld = (app: Application, viewport: Viewport) => {
  const worldContainer = new Container();
  worldContainer.label = 'worldContainer';
  worldContainer.position.x = app.screen.width / 2;
  worldContainer.position.y = app.screen.height / 2;
  worldContainer.scale.x = 10;
  worldContainer.scale.y = 10;
  viewport.addChild(worldContainer);

  const gridGraphics = createGridGraphics({
    color: 0xffffff,
    width: 50,
    height: 50,
  });
  viewport.addChild(gridGraphics);

  return worldContainer;
};

export { drawLinkText, setupUI, setupGraphicsWorld };
