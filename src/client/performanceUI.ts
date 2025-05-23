import Stats from 'stats.js';
import { Client } from 'nengi';
import { PerformanceMetrics } from '../server/PerformanceMonitor';

interface PerformanceStats {
  fps: Stats;
  ms: Stats;
  memory: Stats;
  latency: Stats;
  latencyStatsPanel: Stats.Panel;
  latencyMaxYAxis: number;
  serverPhysics: Stats;
  serverPhysicsPanel: Stats.Panel;
  serverMemory: Stats;
  serverMemoryPanel: Stats.Panel;
  entityCount: Stats;
  entityCountPanel: Stats.Panel;
}

interface ServerMetrics {
  frameTime: number;
  physicsStepTime: number;
  worldStepTime: number;
  entityUpdateTime: number;
  memoryUsage: number;
  entityCount: number;
  playerCount: number;
  timestamp: number;
}

let lastServerMetrics: ServerMetrics | null = null;

const setupPerformanceUI = () => {
  const panelWidth = 80;
  const panelHeight = 48;
  const marginBottom = 10;
  const marginLeft = 10;
  const opacity = 0.7;

  /*
  Layout:
  |1|2|3|
  |4|5|6|
  */

  // FPS
  const fpsStats = new Stats();
  fpsStats.showPanel(0);
  fpsStats.dom.style.left = `${marginLeft}px`;
  fpsStats.dom.style.bottom = `${marginBottom + panelHeight}px`;
  fpsStats.dom.style.top = 'initial';
  fpsStats.dom.style.pointerEvents = 'none';
  fpsStats.dom.style.opacity = opacity.toString();

  // Milliseconds used per frame rendering
  const msStats = new Stats();
  msStats.showPanel(1);
  msStats.dom.style.left = `${marginLeft + panelWidth}px`;
  msStats.dom.style.bottom = `${marginBottom + panelHeight}px`;
  msStats.dom.style.top = 'initial';
  msStats.dom.style.pointerEvents = 'none';
  msStats.dom.style.opacity = opacity.toString();

  // Server Physics Timing
  const serverPhysicsPanel = new Stats.Panel('Physics', '#3993DD', '#0d1a28');
  const serverPhysicsStats = new Stats();
  serverPhysicsStats.showPanel(3);
  serverPhysicsStats.addPanel(serverPhysicsPanel);
  serverPhysicsStats.dom.style.left = `${marginLeft + panelWidth * 2}px`;
  serverPhysicsStats.dom.style.bottom = `${marginBottom + panelHeight}px`;
  serverPhysicsStats.dom.style.top = 'initial';
  serverPhysicsStats.dom.style.pointerEvents = 'none';
  serverPhysicsStats.dom.style.opacity = opacity.toString();

  // MB of allocated js memory
  const memoryStats = new Stats();
  memoryStats.showPanel(2);
  memoryStats.dom.style.left = `${marginLeft}px`;
  memoryStats.dom.style.bottom = `${marginBottom}px`;
  memoryStats.dom.style.top = 'initial';
  memoryStats.dom.style.pointerEvents = 'none';
  memoryStats.dom.style.opacity = opacity.toString();

  // Latency is a custom Stats.js panel
  // We populate it with values from nengi.client.latency
  let latencyMaxYAxis = 0;
  const latencyStatsPanel = new Stats.Panel('MS (Lag)', '#FC814A', '#2d1409');
  const latencyStats = new Stats();
  // 3 = Custom panel type
  latencyStats.showPanel(3);
  latencyStats.addPanel(latencyStatsPanel);
  latencyStats.dom.style.left = `${marginLeft + panelWidth}px`;
  latencyStats.dom.style.bottom = `${marginBottom}px`;
  latencyStats.dom.style.top = 'initial';
  latencyStats.dom.style.pointerEvents = 'none';
  latencyStats.dom.style.opacity = opacity.toString();

  // Server Memory Usage
  const serverMemoryPanel = new Stats.Panel('SRV MB', '#F3B391', '#2d1e0f');
  const serverMemoryStats = new Stats();
  serverMemoryStats.showPanel(3);
  serverMemoryStats.addPanel(serverMemoryPanel);
  serverMemoryStats.dom.style.left = `${marginLeft + panelWidth * 2}px`;
  serverMemoryStats.dom.style.bottom = `${marginBottom}px`;
  serverMemoryStats.dom.style.top = 'initial';
  serverMemoryStats.dom.style.pointerEvents = 'none';
  serverMemoryStats.dom.style.opacity = opacity.toString();

  // Entity Count
  const entityCountPanel = new Stats.Panel('Entities', '#fffa9a', '#2d2d0a');
  const entityCountStats = new Stats();
  entityCountStats.showPanel(3);
  entityCountStats.addPanel(entityCountPanel);
  entityCountStats.dom.style.left = `${marginLeft + panelWidth * 3}px`;
  entityCountStats.dom.style.bottom = `${marginBottom}px`;
  entityCountStats.dom.style.top = 'initial';
  entityCountStats.dom.style.pointerEvents = 'none';
  entityCountStats.dom.style.opacity = opacity.toString();

  document.body.appendChild(fpsStats.dom);
  document.body.appendChild(msStats.dom);
  document.body.appendChild(serverPhysicsStats.dom);
  document.body.appendChild(memoryStats.dom);
  document.body.appendChild(latencyStats.dom);
  document.body.appendChild(serverMemoryStats.dom);
  document.body.appendChild(entityCountStats.dom);

  return {
    fps: fpsStats,
    ms: msStats,
    memory: memoryStats,
    latency: latencyStats,
    latencyStatsPanel: latencyStatsPanel,
    latencyMaxYAxis: latencyMaxYAxis,
    serverPhysics: serverPhysicsStats,
    serverPhysicsPanel: serverPhysicsPanel,
    serverMemory: serverMemoryStats,
    serverMemoryPanel: serverMemoryPanel,
    entityCount: entityCountStats,
    entityCountPanel: entityCountPanel,
  } as PerformanceStats;
};

const performanceBegin = (client: Client, stats: PerformanceStats) => {
  stats.fps.begin();
  stats.ms.begin();
  stats.memory.begin();
  stats.latency.begin();
  stats.serverPhysics.begin();
  stats.serverMemory.begin();
  stats.entityCount.begin();

  stats.latencyMaxYAxis = Math.max(100, client.network.latency * 1.2);
  stats.latencyStatsPanel.update(client.network.latency, stats.latencyMaxYAxis);

  // Update server metrics if available
  if (lastServerMetrics) {
    // Update physics timing (convert to milliseconds)
    stats.serverPhysicsPanel.update(lastServerMetrics.physicsStepTime, 10);

    // Update server memory usage
    stats.serverMemoryPanel.update(
      lastServerMetrics.memoryUsage,
      Math.max(100, lastServerMetrics.memoryUsage * 1.2)
    );

    // Update entity count
    stats.entityCountPanel.update(
      lastServerMetrics.entityCount,
      Math.max(100, lastServerMetrics.entityCount * 1.2)
    );
  }
};

const performanceEnd = (stats: PerformanceStats) => {
  stats.fps.end();
  stats.ms.end();
  stats.memory.end();
  stats.latency.end();
  stats.serverPhysics.end();
  stats.serverMemory.end();
  stats.entityCount.end();
};

const updateServerMetrics = (metrics: PerformanceMetrics) => {
  lastServerMetrics = {
    frameTime: metrics.frameTime,
    physicsStepTime: metrics.physicsStepTime,
    worldStepTime: metrics.worldStepTime,
    entityUpdateTime: metrics.entityUpdateTime,
    memoryUsage: metrics.memoryUsage,
    entityCount: metrics.entityCount,
    playerCount: metrics.playerCount,
    timestamp: metrics.timestamp,
  };
};

export { setupPerformanceUI, performanceBegin, performanceEnd, updateServerMetrics };
