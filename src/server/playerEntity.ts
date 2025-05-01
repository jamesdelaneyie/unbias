import { User, AABB2D } from 'nengi';
import { NType } from '../common/NType';
import * as p2 from 'p2-es';

export class playerEntity extends User {
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
  body: p2.Body | null;

  constructor(user: User, username: string) {
    super(user.socket, user.networkAdapter);
    this.id = user.socket.user.id;
    this.nid = 0;
    this.ntype = NType.Entity;
    this.x = 0;
    this.y = 0;
    this.size = 30;
    this.rotation = 0;
    this.speed = 100;
    this.username = username;
    this.color = this.generateColor();
    this.view = null;
    this.body = null;
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
