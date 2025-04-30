import { User, AABB2D, Binary } from 'nengi';
import { NType } from '../common/NType';
import * as p2 from 'p2-es';

export class playerEntity extends User {
  nid: number;
  ntype: number;
  x: number;
  y: number;
  size: number;
  username: string;
  color: number;
  view: AABB2D | null;
  body: p2.Body | null;

  constructor(nid: number, user: User, username: Binary.String) {
    super(user.socket, user.networkAdapter);
    this.id = user.socket.user.id;
    this.nid = nid;
    this.ntype = NType.Entity;
    this.x = 0;
    this.y = 0;
    this.size = 30;
    this.username = username.toString();
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
