import * as p2 from 'p2-es';

class RayPool {
  private available: p2.Ray[] = [];
  private maxSize: number = 10;

  getRay(): p2.Ray {
    if (this.available.length > 0) {
      return this.available.pop()!;
    }

    return new p2.Ray({
      from: [0, 0],
      to: [0, 0],
      mode: p2.Ray.CLOSEST,
      collisionMask: 0xffffffff,
      skipBackfaces: true,
    });
  }

  returnRay(ray: p2.Ray): void {
    if (this.available.length < this.maxSize) {
      // Reset ray properties
      ray.from = [0, 0];
      ray.to = [0, 0];
      // @ts-ignore
      ray.callback = undefined;
      this.available.push(ray);
    }
  }
}

const rayPool = new RayPool();

export { rayPool, RayPool };
