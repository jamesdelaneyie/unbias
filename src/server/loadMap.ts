import { NetworkType } from '../common/NetworkType';
import { ObjectEntity } from '../common/types';
import { createPhysicalObject } from './EntityManager';
//import { worldConfig } from '../common/worldConfig';
import * as p2 from 'p2-es';
import { ChannelAABB2D } from 'nengi';
import { DynamicObject } from '../common/ObjectEntity';

export const populateWorld = (
  main: ChannelAABB2D,
  world: p2.World,
  ObjectEntities: Map<number, any>,
  dynamicEntities: Map<number, any>
): boolean => {
  const color = 0xffffff;
  const numObjects = 400;
  const gridSize = 4;

  for (let i = 0; i < numObjects; i++) {
    const x = Math.floor(Math.random() * gridSize) + 0.5;
    const y = Math.floor(Math.random() * gridSize) + 0.5;

    const object = new DynamicObject({
      label: 'object',
      x: x,
      y: y,
      rotation: 0,
      mass: 1,
      shape: 'box',
      shapeProps: { type: p2.Shape.BOX, width: 1, height: 1 },
    });
    main.addEntity(object);

    object.body = object.generateBody();
    world.addBody(object.body);

    ObjectEntities.set(object.nid, object);
    dynamicEntities.set(object.nid, object);
  }

  const leftWall: ObjectEntity = {
    label: 'leftWall',
    ntype: NetworkType.StaticObject,
    nid: 500,
    x: -26,
    y: 0,
    width: 1,
    height: 53,
    shape: 'circle',
    color: color,
    rotation: 0,
    body: null as unknown as p2.Body,
    mass: 0,
    bodyType: p2.Body.STATIC,
    renderTarget: { x: 0, y: 0, rotation: 0 },
  };

  const leftWallBody = createPhysicalObject(leftWall);
  leftWall.body = leftWallBody;
  ObjectEntities.set(leftWall.nid, leftWall);
  world.addBody(leftWall.body);
  main.addEntity(leftWall);

  const rightWall: ObjectEntity = {
    label: 'rightWall',
    ntype: NetworkType.StaticObject,
    nid: 501,
    x: 26,
    y: 0,
    width: 1,
    height: 53,
    shape: 'circle',
    color: color,
    rotation: 0,
    body: null as unknown as p2.Body,
    mass: 0,
    bodyType: p2.Body.STATIC,
    renderTarget: { x: 0, y: 0, rotation: 0 },
  };

  const rightWallBody = createPhysicalObject(rightWall);
  rightWall.body = rightWallBody;
  ObjectEntities.set(rightWall.nid, rightWall);
  world.addBody(rightWall.body);
  main.addEntity(rightWall);

  const topWall: ObjectEntity = {
    label: 'topWall',
    ntype: NetworkType.StaticObject,
    nid: 503,
    x: 0,
    y: 26,
    width: 53,
    height: 1,
    shape: 'circle',
    color: color,
    rotation: 0,
    body: null as unknown as p2.Body,
    mass: 0,
    bodyType: p2.Body.STATIC,
    renderTarget: { x: 0, y: 0, rotation: 0 },
  };

  const topWallBody = createPhysicalObject(topWall);
  topWall.body = topWallBody;
  ObjectEntities.set(topWall.nid, topWall);
  world.addBody(topWall.body);
  main.addEntity(topWall);

  const bottomWall: ObjectEntity = {
    label: 'bottomWall',
    ntype: NetworkType.StaticObject,
    nid: 504,
    x: 0,
    y: -26,
    width: 53,
    height: 1,
    shape: 'circle',
    color: color,
    rotation: 0,
    body: null as unknown as p2.Body,
    mass: 0,
    bodyType: p2.Body.STATIC,
    renderTarget: { x: 0, y: 0, rotation: 0 },
  };

  const bottomWallBody = createPhysicalObject(bottomWall);
  bottomWall.body = bottomWallBody;
  ObjectEntities.set(bottomWall.nid, bottomWall);
  world.addBody(bottomWall.body);
  main.addEntity(bottomWall);

  return true;
};
