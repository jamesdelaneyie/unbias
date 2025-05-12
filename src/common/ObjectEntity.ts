import { NetworkType } from './NetworkType';
//import { BodyType, ShapeProps, ShapeType } from './types';
import * as p2 from 'p2-es';

enum BodyType {
  STATIC = 2,
  DYNAMIC = 1,
  KINEMATIC = 4,
}

enum ShapeType {
  CIRCLE = 1,
  BOX = 32,
  CONVEX = 8,
}

type CircleShape = {
  type: ShapeType.CIRCLE;
  radius: number;
};

type RectangleShape = {
  type: ShapeType.BOX;
  width: number;
  height: number;
};

type Point = [number, number];
type PolygonShape = {
  type: ShapeType.CONVEX;
  vertices: Point[];
};

type ShapeProps = CircleShape | RectangleShape | PolygonShape;

export class BaseObject {
  nid: number;
  ntype: number;
  label: string;
  x: number;
  y: number;
  rotation: number;
  color: number;
  mass: number;
  shape: string;
  shapeProps: ShapeProps | null;

  constructor({
    label,
    x,
    y,
    rotation,
    shape,
    shapeProps = null,
  }: {
    label: string;
    x: number;
    y: number;
    rotation: number;
    shape: string;
    shapeProps?: ShapeProps | null;
  }) {
    this.nid = 0;
    this.ntype = NetworkType.DynamicObject | NetworkType.StaticObject;
    this.label = label;
    this.x = x;
    this.y = y;
    this.rotation = rotation;
    this.color = 0xffffff;
    this.mass = 0;
    this.shape = shape;
    this.shapeProps = shapeProps;
  }
}

export class StaticObject extends BaseObject {
  constructor({
    label,
    x,
    y,
    rotation,
    shape,
    shapeProps = null,
  }: {
    label: string;
    x: number;
    y: number;
    rotation: number;
    shape: string;
    shapeProps?: ShapeProps | null;
  }) {
    super({ label, x, y, rotation, shape, shapeProps });
    this.ntype = NetworkType.StaticObject;
    //this.bodyType = BodyType.STATIC;
    this.mass = 0;
  }
}

export class DynamicObject extends BaseObject {
  width: number;
  height: number;
  radius: number;
  vertices: Point[];
  body: p2.Body | null;
  bodyType: BodyType;
  constructor({
    label,
    x,
    y,
    rotation,
    mass,
    shape,
    shapeProps = null,
  }: {
    label: string;
    x: number;
    y: number;
    rotation: number;
    mass: number;
    shape: string;
    shapeProps?: ShapeProps | null;
  }) {
    super({ label, x, y, rotation, shape, shapeProps });
    this.ntype = NetworkType.DynamicObject;
    this.body = null;
    this.bodyType = BodyType.DYNAMIC;
    this.mass = mass;
    // @ts-ignore
    this.width = shapeProps?.width;
    // @ts-ignore
    this.height = shapeProps?.height;
    // @ts-ignore
    this.radius = shapeProps?.radius;
    // @ts-ignore
    this.vertices = shapeProps?.vertices;
  }

  generateBody() {
    const body = new p2.Body({
      mass: this.mass,
      position: [this.x, this.y],
      angle: this.rotation,
      angularDamping: 0.999,
      damping: 0.97,
      type: this.bodyType ?? undefined,
    });

    let shape: p2.Shape | null = null;
    if (this.shapeProps?.type === ShapeType.CIRCLE) {
      shape = new p2.Circle({
        radius: this.shapeProps.radius,
      });
    } else if (this.shapeProps?.type === ShapeType.BOX) {
      shape = new p2.Box({
        width: this.shapeProps.width,
        height: this.shapeProps.height,
      });
    } else if (this.shapeProps?.type === ShapeType.CONVEX) {
      shape = new p2.Convex({
        vertices: this.shapeProps.vertices,
      });
    }
    if (!shape) throw new Error('Invalid or missing shapeProps');

    body.addShape(shape);
    return body;
  }
}
