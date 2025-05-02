import * as SAT from 'sat';
import { PlayerEntity, ObjectEntity } from '@/common/types';

/**
 * Client-side collision detection system using SAT (Separating Axis Theorem)
 * This ensures the client view matches what the server is computing
 */
export class CollisionSystem {
  /**
   * Check if two entities are colliding using SAT
   */
  static checkCollision(entity1: PlayerEntity | ObjectEntity, entity2: ObjectEntity): boolean {
    // Create SAT circles for the entities
    const radius1 = 'size' in entity1 ? entity1.size / 2 : entity1.width / 2;
    const circle1 = new SAT.Circle(new SAT.Vector(entity1.x, entity1.y), radius1);

    const circle2 = new SAT.Circle(new SAT.Vector(entity2.x, entity2.y), entity2.width / 2);

    // Use SAT to check for collision
    const response = new SAT.Response();
    const collided = SAT.testCircleCircle(circle1, circle2, response);

    return collided;
  }

  /**
   * Resolve collision by moving the entity out of the collision
   */
  static resolveCollision(entity: PlayerEntity, objects: ObjectEntity[]): void {
    objects.forEach(object => {
      const playerRadius = entity.size / 2;
      const objectRadius = object.width / 2;

      // Create circles for collision test
      const entityCircle = new SAT.Circle(new SAT.Vector(entity.x, entity.y), playerRadius);

      const objectCircle = new SAT.Circle(new SAT.Vector(object.x, object.y), objectRadius);

      // Get collision response
      const response = new SAT.Response();
      const collided = SAT.testCircleCircle(entityCircle, objectCircle, response);

      if (collided) {
        // Move the entity out of collision based on the overlap vector
        entity.x -= response.overlapV.x;
        entity.y -= response.overlapV.y;
      }
    });
  }

  /**
   * Check if the proposed movement would cause a collision and adjust if needed
   */
  static moveWithCollisions(
    entity: PlayerEntity,
    proposedX: number,
    proposedY: number,
    objects: ObjectEntity[]
  ): { x: number; y: number } {
    // Store original position
    const originalX = entity.x;
    const originalY = entity.y;

    // Try the proposed position
    entity.x = proposedX;
    entity.y = proposedY;

    // Check and resolve collisions
    this.resolveCollision(entity, objects);

    // Get the resolved position
    const resolvedX = entity.x;
    const resolvedY = entity.y;

    // Return to original position (caller will update the actual position)
    entity.x = originalX;
    entity.y = originalY;

    return { x: resolvedX, y: resolvedY };
  }
}
