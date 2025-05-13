import { NetworkType } from './NetworkType';
import * as p2 from 'p2-es';

enum BodyType {
  STATIC = 2,
  DYNAMIC = 1,
  KINEMATIC = 4,
}

type BaseObjectConstructorParams = {
  label: string;
  x: number;
  y: number;
  shape: string;
  width?: number;
  height?: number;
  rotation?: number;
  radius?: number;
  vertices?: string;
  color?: number;
  stroke?: number;
  mass?: number;
};

export class BaseObject {
  nid: number;
  ntype: number;
  label: string;
  x: number;
  y: number;
  rotation: number;
  shape: string;
  width: number;
  height: number;
  radius: number;
  vertices: string;
  color: number;
  stroke: number;
  mass: number;

  constructor({
    label,
    x,
    y,
    rotation,
    shape,
    width,
    height,
    radius,
    vertices,
    color,
    stroke,
    mass,
  }: BaseObjectConstructorParams) {
    this.nid = 0;
    this.ntype = NetworkType.DynamicObject | NetworkType.StaticObject;
    this.label = label;
    this.x = x ?? 0;
    this.y = y ?? 0;
    this.rotation = rotation ?? 0;
    this.color = color ?? 0xffffff;
    this.stroke = stroke ?? 0x000000;
    this.mass = mass ?? 0;
    this.shape = shape ?? 'rectangle';
    this.width = width ?? 1;
    this.height = height ?? 1;
    this.radius = radius ?? 1;
    this.vertices = vertices ?? '';
  }
}

export class StaticObject extends BaseObject {
  body: p2.Body;
  constructor({
    label,
    x,
    y,
    rotation,
    shape,
    width,
    height,
    radius,
    vertices,
    color,
    stroke,
    mass,
  }: BaseObjectConstructorParams) {
    super({ label, x, y, rotation, shape, width, height, radius, vertices, color, stroke, mass });
    this.ntype = NetworkType.StaticObject;
    const dimensions = getShapeDimensions(this);
    this.width = dimensions.width;
    this.height = dimensions.height;
    this.mass = 0;
    this.body = generateBody(this);
  }
}

type DynamicObjectConstructorParams = BaseObjectConstructorParams & {
  bodyType?: BodyType;
};

export class DynamicObject extends BaseObject {
  body: p2.Body;
  bodyType: BodyType;
  constructor({
    label,
    x,
    y,
    rotation,
    mass,
    shape,
    bodyType,
    width,
    height,
    radius,
    vertices,
    color,
    stroke,
  }: DynamicObjectConstructorParams) {
    super({ label, x, y, rotation, shape, width, height, radius, vertices, color, stroke, mass });
    this.ntype = NetworkType.DynamicObject;
    this.body = generateBody(this);
    this.bodyType = bodyType ?? BodyType.DYNAMIC;
  }
}

const getShapeDimensions = (entity: BaseObject): { width: number; height: number } => {
  if (entity.shape === 'circle') {
    const diameter = (entity.radius ?? entity.width) * 2;
    return {
      width: diameter,
      height: diameter,
    };
  } else if (entity.shape === 'polygon' && entity.vertices) {
    const vertices = JSON.parse(entity.vertices);
    let minX = Infinity,
      maxX = -Infinity;
    let minY = Infinity,
      maxY = -Infinity;

    vertices.forEach(([x, y]: [number, number]) => {
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    });

    return {
      width: maxX - minX,
      height: maxY - minY,
    };
  } else {
    return {
      width: entity.width,
      height: entity.height,
    };
  }
};

const generateBody = (entity: BaseObject): p2.Body => {
  const body = new p2.Body({
    mass: entity.mass,
    position: [entity.x, entity.y],
    angle: entity.rotation,
    //damping: 0.97,
    //angularDamping: 0.999,
    ccdSpeedThreshold: 0.1,
  });
  body.addShape(createPhysicsShape(entity));
  return body;
};

const createPhysicsShape = (entity: BaseObject): p2.Shape => {
  if (entity.shape === 'circle') {
    return new p2.Circle({
      radius: entity.radius ?? entity.width / 2,
    });
  } else if (entity.shape === 'capsule') {
    return new p2.Capsule({
      radius: entity.radius ?? entity.width / 2,
      length: entity.width - entity.radius * 2,
    });
  } else if (entity.shape === 'polygon') {
    if (entity.vertices) {
      const rawVertices: [number, number][] = JSON.parse(entity.vertices);

      // Calculate bounding box center of rawVertices
      let minX = Infinity,
        maxX = -Infinity;
      let minY = Infinity,
        maxY = -Infinity;
      rawVertices.forEach(([x, y]) => {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      });
      const bbCenterX = (minX + maxX) / 2;
      const bbCenterY = (minY + maxY) / 2;

      // Shift vertices so their BB is centered at (0,0)
      const centeredVertices = rawVertices.map(([x, y]): [number, number] => [
        x - bbCenterX,
        y - bbCenterY,
      ]);

      return new p2.Convex({
        vertices: centeredVertices,
      });
    } else {
      // Fallback for polygon without vertices: treat as a box
      return new p2.Box({
        width: entity.width,
        height: entity.height,
      });
    }
  } else {
    // Default to Box for unspecified or 'rectangle' shapes
    return new p2.Box({
      width: entity.width,
      height: entity.height,
    });
  }
};
