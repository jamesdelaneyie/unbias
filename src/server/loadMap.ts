import * as p2 from 'p2-es';
import { ChannelAABB2D } from 'nengi';
import { DynamicObject, StaticObject } from '../common/ObjectEntity';

const createRoom = (width: number, height: number, wallThickness: number, color: number) => {
  const entities = [];

  const leftWall = {
    label: 'leftWall',
    shape: 'rectangle',
    x: -width / 2,
    y: 0,
    width: wallThickness,
    height: height + wallThickness,
    color: color,
  };

  const leftWallObject = new StaticObject(leftWall);
  entities.push(leftWallObject);

  const rightWall = {
    label: 'rightWall',
    shape: 'rectangle',
    x: width / 2,
    y: 0,
    width: wallThickness,
    height: height + wallThickness,
    color: color,
  };

  const rightWallObject = new StaticObject(rightWall);
  entities.push(rightWallObject);

  const topWall = {
    label: 'topWall',
    shape: 'rectangle',
    x: 0,
    y: height / 2,
    width: width + wallThickness,
    height: wallThickness,
    color: color,
  };

  const topWallObject = new StaticObject(topWall);
  entities.push(topWallObject);
  const bottomWall = {
    label: 'bottomWall',
    shape: 'rectangle',
    x: 0,
    y: -height / 2,
    width: width + wallThickness,
    height: wallThickness,
    color: color,
  };

  const bottomWallObject = new StaticObject(bottomWall);
  entities.push(bottomWallObject);

  return entities;
};

export const debugMap = (
  main: ChannelAABB2D,
  world: p2.World,
  staticEntities: Map<number, any>,
  dynamicEntities: Map<number, any>
): boolean => {
  const numObjects = 0;
  const gridSize = 30;

  let objectsCreated = 0;
  const createObject = () => {
    if (objectsCreated >= numObjects) {
      return;
    }

    const x = Math.floor(Math.random() * gridSize) - 15;
    const y = Math.floor(Math.random() * gridSize) - 15;
    const size = Math.floor(Math.random() * 10) + 1;
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

    dynamicEntities.set(object.nid, object);

    objectsCreated++;
    setTimeout(createObject, 50);
  };

  createObject();

  const walls = createRoom(50, 50, 3, 0xffffff);
  walls.forEach(wall => {
    main.addEntity(wall);
    world.addBody(wall.body);
    staticEntities.set(wall.nid, wall);
  });

  /*const polygon = {
    label: 'polygon',
    shape: 'polygon',
    x: 0,
    y: 10,
    rotation: 90,
    vertices: '[[-7,-7], [7,-7], [7,7], [0, 13], [-7,7]]',
    color: 0xff0000,
  };

  const polygonObject = new StaticObject(polygon);
  main.addEntity(polygonObject);
  world.addBody(polygonObject.body);
  staticEntities.set(polygonObject.nid, polygonObject);

  const capsule = {
    label: 'capsule',
    shape: 'capsule',
    x: 0,
    y: -10,
    rotation: 0,
    width: 30,
    height: 10,
    radius: 5,
    color: 0x00ff00,
  };
  const capsuleObject = new StaticObject(capsule);
  main.addEntity(capsuleObject);
  world.addBody(capsuleObject.body);
  staticEntities.set(capsuleObject.nid, capsuleObject);*/

  return true;
};

export const loadMap = (
  main: ChannelAABB2D,
  world: p2.World,
  staticEntities: Map<number, any>,
  dynamicEntities: Map<number, any>,
  mapName: string = 'debugMap'
): boolean => {
  switch (mapName) {
    case 'debugMap':
    default:
      return debugMap(main, world, staticEntities, dynamicEntities);
  }
};
