import '@pixi/layout';
import { Client } from 'nengi';
import { Application, Container, Text } from 'pixi.js'; //HTMLText, Text
import TaggedTextPlus from 'pixi-tagged-text-plus';
import { createGridGraphics } from '@/client/graphics/mapGraphics';
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

const updatePerformanceStats = (
  delta: number,
  client: Client,
  performanceStats: any,
  app: Application
) => {
  const fps = delta > 0 ? 1 / delta : 0;
  const clientTick = client.network.clientTick;
  const latency = client.network.latency;
  const avgTimeDifference = client.network.chronus.averageTimeDifference;
  performanceStats.fps = fps;
  performanceStats.clientTick = clientTick;
  performanceStats.latency = latency;
  performanceStats.avgTimeDifference = avgTimeDifference;
  // @ts-ignore
  performanceStats.memory = Math.round(performance.memory.usedJSHeapSize / (1024 * 1024));
  // @ts-ignore
  performanceStats.totalMemory = Math.round(performance.memory.totalJSHeapSize / (1024 * 1024));
  // @ts-ignore
  const statsText = app.stage
    .getChildByLabel('UserInterfaceContainer')
    .getChildByLabel('StatsContainer')
    .getChildByLabel('StatsText');
  // @ts-ignore
  statsText.text = `fps: ${fps.toFixed(2)}\nclientTick: ${clientTick}\nlatency: ${latency}ms\navgTimeDifference: ${avgTimeDifference.toFixed(2)}s\nmemory: ${performanceStats.memory}\ntotalMemory: ${performanceStats.totalMemory}\nnetworkMessages: ${performanceStats.networkMessages}`;
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
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    padding: 10,
  };

  const statsContainer = new Container();
  statsContainer.label = 'StatsContainer';
  statsContainer.zIndex = 1000;
  statsContainer.layout = true;
  app.stage.addChild(statsContainer);

  const statsText = new Text({
    text: ``,
    style: {
      fill: 'white',
      fontSize: 10,
    },
  });
  statsText.label = 'StatsText';
  statsText.layout = true;
  statsText.alpha = 1;
  statsContainer.addChild(statsText);

  UserInterfaceContainer.addChild(statsContainer);

  /*
  const textContainer = new Container({
    layout: {
      width: '80%',
      height: '80%',
      gap: 4,
      flexWrap: 'wrap',
      justifyContent: 'center',
      alignContent: 'center',
    },
  });
  UserInterfaceContainer.addChild(textContainer);

  const startText = new Text({
    text: 'hello',
    style: {
      fill: 'white',
      fontSize: 24,
    },
  });
  startText.layout = true;
  textContainer.addChild(startText);

  const linkText = new HTMLText({
    text: 'i am a link',
    style: {
      fill: 'white',
      fontSize: 24,
    },
  });
  linkText.layout = true;
  linkText.interactive = true;
  linkText.on('click', () => {
    console.log('clicked');
  });
  linkText.on('mouseover', () => {
    linkText.style.addOverride('text-decoration', 'underline');
    console.log('mouseover');
  });
  linkText.on('mouseout', () => {
    linkText.style.removeOverride('text-decoration');
    console.log('mouseout');
  });
  textContainer.addChild(linkText);
  const underline: TextDecoration = 'underline';
  const navLinkTextStyles = {
    default: {
      fontSize: '13px',
      fill: '#ffffff',
    },
    underline: {
      fontSize: '13px',
      fill: '#ffffff',
      textDecoration: underline,
      underlineColor: '#ffffff',
      underlineThickness: 1,
      underlineOffset: 1,
    },
  };

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

  const endText = new Text({
    text: 'end',
    style: {
      fill: 'white',
      fontSize: 24,
    },
  });
  endText.layout = true;
  textContainer.addChild(endText);

  /* for (let i = 0; i < 10; i++) {
    const text = new Text({
      text: 'hello',
      style: {
        fill: 'white',
        fontSize: 24,
      },
    });*/
  /*const text = new HTMLText({
      text: '<a href="https://www.google.com">hello</a>',
      style: {
        fill: 'white',
        fontSize: 24,
      },
    });
    text.layout = true;
    textContainer.addChild(text);
  }*/
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

export { drawBasicText, setupUI, setupGraphicsWorld, updatePerformanceStats };
