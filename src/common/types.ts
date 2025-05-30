import { Binary, IEntity } from 'nengi';
import { NetworkType } from './NetworkType';
import { Container } from 'pixi.js';
import * as p2 from 'p2-es';

/* Base Entity */
type Entity = {
  nid: number;
  ntype: NetworkType;
  x: number;
  y: number;
  rotation: number;
  mass: number;
  body: p2.Body;
  bodyType: typeof p2.Body.STATIC | typeof p2.Body.DYNAMIC | typeof p2.Body.KINEMATIC;
};

type PlayerEntity = Entity & {
  username: string;
  isSelf: boolean;
  isAlive: boolean;
  color: number;
  speed: number;
  size: number;
  body: p2.Body;
  clientGraphics?: Container;
  serverGraphics?: Container;
  renderTarget: { x: number; y: number; rotation: number };
};

type ObjectEntity = Entity & {
  label: string;
  width: number;
  height: number;
  shape: string;
  color: number;
  rotation: number;
  body: p2.Body;
  bodyType: typeof p2.Body.STATIC | typeof p2.Body.DYNAMIC | typeof p2.Body.KINEMATIC;
  mass: number;
  clientGraphics?: Container;
  renderTarget: { x: number; y: number; rotation: number };
};

type EntityMap = Map<Binary.UInt8, Entity>;
//the I in IEntity stands for Interpolated
type IEntityMap = Map<Binary.UInt8, IEntity>;
type PlayerEntityMap = Map<Binary.UInt8, PlayerEntity>;
type ObjectEntityMap = Map<Binary.UInt8, ObjectEntity>;

/* Commands: Messages from the client to the server */
type Command = {
  ntype: NetworkType.MoveCommand | NetworkType.UsernameCommand | NetworkType.ShotImpactCommand;
  nid: number;
};

type MoveCommand = Command & {
  w: boolean;
  a: boolean;
  s: boolean;
  d: boolean;
  space: boolean;
  leftClick: boolean;
  rotation: number;
  delta: number;
};

type UsernameCommand = Command & {
  username: string;
};

export {
  Entity,
  IEntity,
  EntityMap,
  IEntityMap,
  PlayerEntity,
  PlayerEntityMap,
  Command,
  MoveCommand,
  ObjectEntity,
  ObjectEntityMap,
  UsernameCommand,
};
