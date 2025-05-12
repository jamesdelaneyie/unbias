import * as p2 from 'p2-es';
import { ChannelAABB2D } from 'nengi';
import { DynamicObject, StaticObject } from '../common/ObjectEntity';

export const populateWorld = (
  main: ChannelAABB2D,
  world: p2.World,
  ObjectEntities: Map<number, any>,
  dynamicEntities: Map<number, any>
): boolean => {
  const color = 0xffffff;
  const numObjects = 200;
  const gridSize = 30;

  for (let i = 0; i < numObjects; i++) {
    const x = Math.floor(Math.random() * gridSize) - 15;
    const y = Math.floor(Math.random() * gridSize) - 15;
    const size = Math.floor(Math.random() * 5) + 1;
    const shape = Math.random() < 0.5 ? 'rectangle' : 'circle';

    const object = new DynamicObject({
      label: 'object',
      x: x,
      y: y,
      rotation: 0,
      mass: 1,
      shape: shape,
      width: size,
      height: size,
      radius: size / 2,
    });
    main.addEntity(object);
    world.addBody(object.body);

    ObjectEntities.set(object.nid, object);
    dynamicEntities.set(object.nid, object);
  }

  const leftWall = {
    label: 'leftWall',
    shape: 'rectangle',
    x: -26,
    y: 0,
    width: 1,
    height: 53,
    color: color,
  };

  const leftWallObject = new StaticObject(leftWall);
  main.addEntity(leftWallObject);
  world.addBody(leftWallObject.body);
  ObjectEntities.set(leftWallObject.nid, leftWallObject);

  const rightWall = {
    label: 'rightWall',
    shape: 'rectangle',
    x: 26,
    y: 0,
    width: 1,
    height: 53,
    color: color,
  };

  const rightWallObject = new StaticObject(rightWall);
  main.addEntity(rightWallObject);
  world.addBody(rightWallObject.body);
  ObjectEntities.set(rightWallObject.nid, rightWallObject);

  const topWall = {
    label: 'topWall',
    shape: 'rectangle',
    x: 0,
    y: 26,
    width: 53,
    height: 1,
    color: color,
  };

  const topWallObject = new StaticObject(topWall);
  main.addEntity(topWallObject);
  world.addBody(topWallObject.body);
  ObjectEntities.set(topWallObject.nid, topWallObject);

  const bottomWall = {
    label: 'bottomWall',
    shape: 'rectangle',
    x: 0,
    y: -26,
    width: 53,
    height: 1,
    color: color,
  };

  const bottomWallObject = new StaticObject(bottomWall);
  main.addEntity(bottomWallObject);
  world.addBody(bottomWallObject.body);
  ObjectEntities.set(bottomWallObject.nid, bottomWallObject);

  return true;
};
