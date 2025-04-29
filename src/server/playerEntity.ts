import { User, AABB2D } from 'nengi';
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

  constructor(nid: number, user: User) {
    super(user.socket, user.networkAdapter);
    this.nid = nid;
    this.x = 0;
    this.y = 0;
    this.size = 0;
    this.username = '';
    this.color = 0;
    this.ntype = NType.Entity;
    this.view = null;
    this.body = null;
  }
}
