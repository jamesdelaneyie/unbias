import { NetworkType } from '../common/NType';
import { ObjectEntity, Entity } from '../common/types';
import { createPhysicalObject } from './EntityManager';
//import { worldConfig } from '../common/worldConfig';
import * as p2 from 'p2-es';
import { ChannelAABB2D } from 'nengi';

export const populateWorld = (
  main: ChannelAABB2D,
  world: p2.World,
  ObjectEntities: Map<number, ObjectEntity>,
  dynamicEntities: Map<number, Entity>
): boolean => {
  const color = 0xffffff;
  const numObjects = 400;
  const gridSize = 4;

  for (let i = 0; i < numObjects; i++) {
    // Random position within 4x4 grid
    const x = Math.floor(Math.random() * gridSize) + 0.5;
    const y = Math.floor(Math.random() * gridSize) + 0.5;

    const object: ObjectEntity = {
      nid: i + 1,
      ntype: NetworkType.Object,
      x: x,
      y: y,
      width: 1,
      height: 1,
      shape: 'circle',
      color: color,
      rotation: 0,
      body: null as unknown as p2.Body,
      mass: 1,
      bodyType: p2.Body.DYNAMIC,
      renderTarget: { x: 0, y: 0, rotation: 0 },
    };

    const objectBody = createPhysicalObject(object);
    object.body = objectBody;
    ObjectEntities.set(object.nid, object);
    dynamicEntities.set(object.nid, object);
    world.addBody(object.body);
    main.addEntity(object);
  }

  const leftWall: ObjectEntity = {
    ntype: NetworkType.Object,
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
    ntype: NetworkType.Object,
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
    ntype: NetworkType.Object,
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
    ntype: NetworkType.Object,
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
