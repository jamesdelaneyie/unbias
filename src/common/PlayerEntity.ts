import { User, AABB2D } from 'nengi';
import { NetworkType } from './NetworkType';
import * as p2 from 'p2-es';
import { config } from './config';

enum BodyType {
  STATIC = 2,
  DYNAMIC = 1,
  KINEMATIC = 4,
}

export class PlayerEntity extends User {
  nid: number;
  ntype: number;
  x: number;
  y: number;
  size: number;
  rotation: number;
  speed: number;
  username: string;
  health: number;
  isSelf: boolean;
  isAlive: boolean;
  color: number;
  view: AABB2D;
  mass: number;
  body: p2.Body;
  bodyType: BodyType;
  renderTarget: { x: number; y: number; rotation: number };

  constructor(user: User, username: string) {
    super(user.socket, user.networkAdapter);
    this.id = user.socket.user.id;
    this.nid = 0;
    this.ntype = NetworkType.PlayerEntity;
    this.x = -15;
    this.y = -15;
    this.size = config.playerSize;
    this.rotation = 0;
    this.speed = config.playerSpeed;
    this.username = username;
    this.health = 100;
    this.isSelf = false;
    this.isAlive = true;
    this.color = this.generateColor();
    this.view = new AABB2D(0, 0, config.viewSize, config.viewSize);
    this.mass = 5;
    this.body = this.generatePlayerBody();
    this.bodyType = BodyType.DYNAMIC;
    this.renderTarget = { x: 0, y: 0, rotation: 0 };
  }

  generatePlayerBody() {
    this.body = new p2.Body({
      mass: this.mass,
      position: [this.x, this.y],
      type: this.bodyType,
      ccdSpeedThreshold: 1,
      ccdIterations: 20,
    });
    const circleShape = new p2.Circle({
      radius: this.size / 2,
    });
    this.body.addShape(circleShape);

    const noseVertices = [
      [0, -this.size / 2],
      [this.size * 0.8666, 0],
      [0, this.size / 2],
    ];
    const noseShape = new p2.Convex({
      vertices: noseVertices,
      position: [this.x, this.y],
    });
    this.body.addShape(noseShape);

    return this.body;
  }

  generateColor() {
    return parseInt(
      Array.from(this.username)
        .reduce((hash, char) => {
          return (hash << 5) - hash + char.charCodeAt(0);
        }, 5381)
        .toString(16)
        .slice(-6)
        .padStart(6, '0'),
      16
    );
  }
}
