import { Binary, IEntity } from 'nengi';
import { NType } from './NType';
import { Container } from 'pixi.js';
import * as p2 from 'p2-es';
import * as SAT from 'sat';
type Entity = {
  nid: Binary.UInt8;
  ntype: NType;
  x: Binary.Float32;
  y: Binary.Float32;
  rotation: Binary.Float32;
};

type PlayerEntity = Entity & {
  username: string;
  color: number;
  speed: number;
  size: number;
  body?: p2.Body;
  graphics?: Container;
  renderTarget: { x: number; y: number; rotation: number };
};

type ObjectEntity = Entity & {
  width: number;
  height: number;
  shape: string;
  color: number;
  body?: p2.Body;
  graphics?: Container;
  renderTarget: { x: number; y: number; rotation: number };
  clientCollisionBody?: SAT.Circle;
};

type EntityMap = Map<Binary.UInt8, Entity>;
type IEntityMap = Map<Binary.UInt8, IEntity>;
type PlayerEntityMap = Map<Binary.UInt8, PlayerEntity>;
type ObjectEntityMap = Map<Binary.UInt8, ObjectEntity>;
type Command = {
  ntype: NType.Command;
  nid: Binary.UInt8;
  delta: Binary.Float32;
};

type MoveCommand = Command & {
  w: Binary.Boolean;
  a: Binary.Boolean;
  s: Binary.Boolean;
  d: Binary.Boolean;
  rotation: Binary.Float32;
};

type UsernameCommand = Command & {
  username: string;
};

export {
  Entity,
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
