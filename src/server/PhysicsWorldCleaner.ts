import * as p2 from 'p2-es';
import { PlayerEntity, ObjectEntity } from '../common/types';

export class PhysicsWorldCleaner {
  private lastCleanup: number = 0;
  private cleanupInterval: number = 30000; // 30 seconds

  shouldCleanup(): boolean {
    return Date.now() - this.lastCleanup > this.cleanupInterval;
  }

  cleanupWorld(
    world: p2.World,
    playerEntities: Map<number, PlayerEntity>,
    objectEntities: Map<number, ObjectEntity>
  ): void {
    if (!this.shouldCleanup()) return;

    console.log('🧹 Starting physics world cleanup...');
    const startTime = performance.now();

    let removedBodies = 0;
    let fixedBodies = 0;

    // Check for orphaned bodies (bodies in world but not in entity maps)
    const orphanedBodies: p2.Body[] = [];

    world.bodies.forEach(body => {
      // @ts-ignore
      const nid = body.nid;
      if (nid !== undefined) {
        const hasPlayerEntity = Array.from(playerEntities.values()).some(p => p.body === body);
        const hasObjectEntity = Array.from(objectEntities.values()).some(o => o.body === body);

        if (!hasPlayerEntity && !hasObjectEntity) {
          orphanedBodies.push(body);
        }
      }
    });

    // Remove orphaned bodies
    orphanedBodies.forEach(body => {
      try {
        world.removeBody(body);
        removedBodies++;
      } catch (error) {
        console.warn('Failed to remove orphaned body:', error);
      }
    });

    // Check for invalid body states
    world.bodies.forEach(body => {
      // Fix NaN positions
      if (isNaN(body.position[0]) || isNaN(body.position[1])) {
        body.position[0] = 0;
        body.position[1] = 0;
        body.velocity[0] = 0;
        body.velocity[1] = 0;
        fixedBodies++;
      }

      // Fix infinite velocities
      if (!isFinite(body.velocity[0]) || !isFinite(body.velocity[1])) {
        body.velocity[0] = 0;
        body.velocity[1] = 0;
        fixedBodies++;
      }

      // Fix extreme velocities that could cause instability
      const maxVelocity = 1000;
      if (Math.abs(body.velocity[0]) > maxVelocity) {
        body.velocity[0] = Math.sign(body.velocity[0]) * maxVelocity;
        fixedBodies++;
      }
      if (Math.abs(body.velocity[1]) > maxVelocity) {
        body.velocity[1] = Math.sign(body.velocity[1]) * maxVelocity;
        fixedBodies++;
      }
    });

    // Clear accumulated contact equations if too many
    if (world.narrowphase.contactEquations.length > 1000) {
      world.narrowphase.contactEquations.length = 0;
      console.log('🧹 Cleared excessive contact equations');
    }

    const cleanupTime = performance.now() - startTime;
    this.lastCleanup = Date.now();

    console.log(`🧹 Physics cleanup completed in ${cleanupTime.toFixed(2)}ms:`);
    console.log(`   • Removed ${removedBodies} orphaned bodies`);
    console.log(`   • Fixed ${fixedBodies} invalid body states`);
    console.log(`   • Current bodies in world: ${world.bodies.length}`);
    console.log(`   • Current contact pairs: ${world.narrowphase.contactEquations.length}`);
  }

  forceCleanup(): void {
    this.lastCleanup = 0;
  }
}
