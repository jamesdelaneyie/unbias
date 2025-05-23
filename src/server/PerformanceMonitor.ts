export interface PerformanceMetrics {
  frameTime: number;
  tickRate: number;
  physicsStepTime: number;
  worldStepTime: number;
  raycastTime: number;
  entityUpdateTime: number;
  entityCount: number;
  playerCount: number;
  dynamicEntityCount: number;
  commandProcessingTime: number;
  messageQueueSize: number;
  memoryUsage: number;
  cpuUsage: number;
  timestamp: number;

  // New physics health metrics
  physicsBodyCount: number;
  physicsContactPairs: number;
  physicsSolverIterations: number;
}

export class PerformanceMonitor {
  private metrics: PerformanceMetrics;
  private frameStartTime: number = 0;
  // eslint-disable-next-line no-undef
  private lastCpuUsage: NodeJS.CpuUsage | null = null;

  constructor() {
    this.metrics = {
      frameTime: 0,
      tickRate: 0,
      physicsStepTime: 0,
      worldStepTime: 0,
      raycastTime: 0,
      entityUpdateTime: 0,
      entityCount: 0,
      playerCount: 0,
      dynamicEntityCount: 0,
      commandProcessingTime: 0,
      messageQueueSize: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      timestamp: 0,
      physicsBodyCount: 0,
      physicsContactPairs: 0,
      physicsSolverIterations: 0,
    };
  }

  startFrame(): void {
    this.frameStartTime = performance.now();
  }

  endFrame(): void {
    this.metrics.frameTime = performance.now() - this.frameStartTime;
    this.metrics.timestamp = Date.now();
    this.updateMemoryUsage();
    this.updateCpuUsage();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  startTiming(label: keyof PerformanceMetrics): number {
    return performance.now();
  }

  endTiming(label: keyof PerformanceMetrics, startTime: number): void {
    if (typeof this.metrics[label] === 'number') {
      (this.metrics as any)[label] = performance.now() - startTime;
    }
  }

  setMetric(label: keyof PerformanceMetrics, value: number): void {
    if (typeof this.metrics[label] === 'number') {
      (this.metrics as any)[label] = value;
    }
  }

  private updateMemoryUsage(): void {
    const memUsage = process.memoryUsage();
    // Convert to MB
    this.metrics.memoryUsage = memUsage.heapUsed / 1024 / 1024;
  }

  private updateCpuUsage(): void {
    const currentCpuUsage = process.cpuUsage();

    if (this.lastCpuUsage) {
      const userDiff = currentCpuUsage.user - this.lastCpuUsage.user;
      const systemDiff = currentCpuUsage.system - this.lastCpuUsage.system;
      const totalDiff = userDiff + systemDiff;

      // Convert to percentage (rough estimate)
      this.metrics.cpuUsage = (totalDiff / 1000000) * 100; // Convert microseconds to percentage
    }

    this.lastCpuUsage = currentCpuUsage;
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  reset(): void {
    const timestamp = this.metrics.timestamp;
    const memoryUsage = this.metrics.memoryUsage;
    const cpuUsage = this.metrics.cpuUsage;

    this.metrics = {
      frameTime: 0,
      tickRate: 0,
      physicsStepTime: 0,
      worldStepTime: 0,
      raycastTime: 0,
      entityUpdateTime: 0,
      entityCount: 0,
      playerCount: 0,
      dynamicEntityCount: 0,
      commandProcessingTime: 0,
      messageQueueSize: 0,
      memoryUsage,
      cpuUsage,
      timestamp,
      physicsBodyCount: 0,
      physicsContactPairs: 0,
      physicsSolverIterations: 0,
    };
  }
}
