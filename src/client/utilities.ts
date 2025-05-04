import { Application } from 'pixi.js';

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

  document.body.appendChild(app.canvas);
  return app;
};

export { initRenderer };
