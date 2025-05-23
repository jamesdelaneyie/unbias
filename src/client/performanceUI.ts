import Stats from 'stats.js';
import { Client } from 'nengi';

interface PerformanceStats {
  fps: Stats;
  ms: Stats;
  memory: Stats;
  latency: Stats;
  latencyStatsPanel: Stats.Panel;
  latencyMaxYAxis: number;
}

const setupPerformanceUI = () => {
  const panelWidth = 80;
  const panelHeight = 48;
  const marginBottom = 10;
  const marginLeft = 10;
  const opacity = 0.7;

  /*
  Layout:
  |1|2|
  |3|4|
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

  // Next colors: #3993DD, #F3B391, #fffa9a

  document.body.appendChild(fpsStats.dom);
  document.body.appendChild(msStats.dom);
  document.body.appendChild(memoryStats.dom);
  document.body.appendChild(latencyStats.dom);

  return {
    fps: fpsStats,
    ms: msStats,
    memory: memoryStats,
    latency: latencyStats,
    latencyStatsPanel: latencyStatsPanel,
    latencyMaxYAxis: latencyMaxYAxis,
  } as PerformanceStats;
};

const performanceBegin = (client: Client, stats: PerformanceStats) => {
  stats.fps.begin();
  stats.ms.begin();
  stats.memory.begin();
  stats.latency.begin();

  stats.latencyMaxYAxis = Math.max(100, client.network.latency * 1.2);
  stats.latencyStatsPanel.update(client.network.latency, stats.latencyMaxYAxis);
};

const performanceEnd = (stats: PerformanceStats) => {
  stats.fps.end();
  stats.ms.end();
  stats.memory.end();
  stats.latency.end();
};

export { setupPerformanceUI, performanceBegin, performanceEnd };
