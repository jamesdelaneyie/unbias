import { User, AABB2D } from 'nengi';
import { NType } from './NType';
import * as p2 from 'p2-es';
import { worldConfig } from './worldConfig';

export class PlayerEntity extends User {
  nid: number;
  ntype: number;
  x: number;
  y: number;
  size: number;
  rotation: number;
  speed: number;
  username: string;
  color: number;
  view: AABB2D | null;
  body: p2.Body;
  renderTarget: { x: number; y: number; rotation: number };

  constructor(user: User, username: string) {
    super(user.socket, user.networkAdapter);
    this.id = user.socket.user.id;
    this.nid = 0;
    this.ntype = NType.Entity;
    this.x = 0;
    this.y = 0;
    this.size = worldConfig.playerSize;
    this.rotation = 0;
    this.speed = worldConfig.playerSpeed;
    this.username = username;
    this.color = this.generateColor();
    this.view = null;
    this.body = this.generatePlayerBody();
    this.renderTarget = { x: 0, y: 0, rotation: 0 };
  }

  generatePlayerBody() {
    this.body = new p2.Body({
      mass: 10,
      position: [this.x, this.y],
    });
    const circleShape = new p2.Circle({
      radius: this.size / 2,
    });
    this.body.addShape(circleShape);
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
