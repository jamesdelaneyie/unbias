import { Binary, IEntity } from 'nengi';
import { NType } from './NType';
import { Container } from 'pixi.js';
import * as p2 from 'p2-es';

/* Entities: Players and Objects */
type Entity = {
  nid: Binary.UInt8;
  ntype: NType;
  x: Binary.Float32;
  y: Binary.Float32;
  rotation: Binary.Float32;
  [key: string]: any;
};

type PlayerEntity = Entity & {
  username: string;
  isSelf: boolean;
  color: number;
  speed: number;
  size: number;
  body?: p2.Body;
  clientGraphics?: Container;
  serverGraphics?: Container;
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
};

type EntityMap = Map<Binary.UInt8, Entity>;
//the I in IEntity stands for Interpolated
type IEntityMap = Map<Binary.UInt8, IEntity>;
type PlayerEntityMap = Map<Binary.UInt8, PlayerEntity>;
type ObjectEntityMap = Map<Binary.UInt8, ObjectEntity>;

/* Commands: Messages from the client to the server */
type Command = {
  ntype: NType.MoveCommand;
  nid: Binary.UInt8;
  delta: Binary.Float32;
};

type MoveCommand = Command & {
  w: boolean;
  a: boolean;
  s: boolean;
  d: boolean;
  rotation: number;
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
