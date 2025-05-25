import { Application } from 'pixi.js';
import { Viewport } from 'pixi-viewport';

const initRenderer = async () => {
  const app = new Application();
  await app.init({
    antialias: true,
    autoDensity: true,
    background: '#000000',
    resolution: window.devicePixelRatio,
    resizeTo: window,
  });
  //@ts-ignore Allows PixiJS dev tools
  globalThis.__PIXI_APP__ = app;

  const viewport = new Viewport({
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
    worldWidth: 3000,
    worldHeight: 3000,
    events: app.renderer.events,
  });

  viewport.scale.set(10);

  app.stage.addChild(viewport);

  document.body.appendChild(app.canvas);
  return { app, viewport };
};

export { initRenderer };
