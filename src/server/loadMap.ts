import * as p2 from 'p2-es';
import { ChannelAABB2D } from 'nengi';
import { DynamicObject, StaticObject } from '../common/ObjectEntity';

export const populateWorld = (
  main: ChannelAABB2D,
  world: p2.World,
  staticEntities: Map<number, any>,
  dynamicEntities: Map<number, any>
): boolean => {
  const color = 0xffffff;
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

  const roomSize = 70;
  const wallThickness = 3;

  const leftWall = {
    label: 'leftWall',
    shape: 'rectangle',
    x: -roomSize / 2,
    y: 0,
    width: wallThickness,
    height: roomSize + wallThickness,
    color: color,
  };

  const leftWallObject = new StaticObject(leftWall);
  main.addEntity(leftWallObject);
  world.addBody(leftWallObject.body);
  staticEntities.set(leftWallObject.nid, leftWallObject);

  const rightWall = {
    label: 'rightWall',
    shape: 'rectangle',
    x: roomSize / 2,
    y: 0,
    width: wallThickness,
    height: roomSize + wallThickness,
    color: color,
  };

  const rightWallObject = new StaticObject(rightWall);
  main.addEntity(rightWallObject);
  world.addBody(rightWallObject.body);
  staticEntities.set(rightWallObject.nid, rightWallObject);

  const topWall = {
    label: 'topWall',
    shape: 'rectangle',
    x: 0,
    y: roomSize / 2,
    width: roomSize + wallThickness,
    height: wallThickness,
    color: color,
  };

  const topWallObject = new StaticObject(topWall);
  main.addEntity(topWallObject);
  world.addBody(topWallObject.body);
  staticEntities.set(topWallObject.nid, topWallObject);

  const bottomWall = {
    label: 'bottomWall',
    shape: 'rectangle',
    x: 0,
    y: -roomSize / 2,
    width: roomSize + wallThickness,
    height: wallThickness,
    color: color,
  };

  const bottomWallObject = new StaticObject(bottomWall);
  main.addEntity(bottomWallObject);
  world.addBody(bottomWallObject.body);
  staticEntities.set(bottomWallObject.nid, bottomWallObject);

  const polygon = {
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
  staticEntities.set(capsuleObject.nid, capsuleObject);

  return true;
};
