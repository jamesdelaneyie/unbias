import { PerformanceMetrics } from '../server/PerformanceMonitor';

interface DetailedMetricsDisplay {
  container: HTMLDivElement;
  isVisible: boolean;
  lastMetrics: PerformanceMetrics | null;
}

let detailedDisplay: DetailedMetricsDisplay | null = null;

const createDetailedPerformanceUI = (): DetailedMetricsDisplay => {
  const container = document.createElement('div');
  container.id = 'detailed-performance-metrics';
  container.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: rgba(0, 0, 0, 0.8);
    color: #ffffff;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 12px;
    padding: 15px;
    border-radius: 8px;
    border: 1px solid #333;
    z-index: 10000;
    min-width: 300px;
    display: none;
    backdrop-filter: blur(5px);
  `;

  const title = document.createElement('h3');
  title.textContent = 'Server Performance Metrics';
  title.style.cssText = `
    margin: 0 0 12px 0;
    color: #4CAF50;
    font-size: 14px;
    border-bottom: 1px solid #333;
    padding-bottom: 8px;
  `;

  const content = document.createElement('div');
  content.id = 'metrics-content';

  container.appendChild(title);
  container.appendChild(content);
  document.body.appendChild(container);

  // Add keyboard toggle (P key)
  document.addEventListener('keydown', event => {
    if (event.key === 'p' || event.key === 'P') {
      toggleDetailedMetrics();
    }
  });

  return {
    container,
    isVisible: false,
    lastMetrics: null,
  };
};

const formatNumber = (value: number, decimals: number = 2): string => {
  return value.toFixed(decimals);
};

const formatTime = (ms: number): string => {
  return `${formatNumber(ms, 3)}ms`;
};

const getPerformanceColor = (value: number, good: number, warning: number): string => {
  if (value <= good) return '#4CAF50';
  if (value <= warning) return '#FF9800';
  return '#F44336';
};

const updateDetailedMetrics = (metrics: PerformanceMetrics): void => {
  if (!detailedDisplay) {
    detailedDisplay = createDetailedPerformanceUI();
  }

  detailedDisplay.lastMetrics = metrics;

  if (!detailedDisplay.isVisible) return;

  const content = document.getElementById('metrics-content');
  if (!content) return;

  const frameTimeColor = getPerformanceColor(metrics.frameTime, 16, 33);
  const physicsColor = getPerformanceColor(metrics.physicsStepTime, 5, 10);
  const memoryColor = getPerformanceColor(metrics.memoryUsage, 100, 200);

  content.innerHTML = `
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
      <div>
        <h4 style="margin: 0 0 8px 0; color: #2196F3; font-size: 13px;">Frame Performance</h4>
        <div style="margin-bottom: 4px;">
          <span style="color: #ccc;">Frame Time:</span> 
          <span style="color: ${frameTimeColor}; font-weight: bold;">${formatTime(metrics.frameTime)}</span>
        </div>
        <div style="margin-bottom: 4px;">
          <span style="color: #ccc;">Tick Rate:</span> 
          <span style="color: #4CAF50;">${formatNumber(metrics.tickRate, 0)} TPS</span>
        </div>
        <div style="margin-bottom: 4px;">
          <span style="color: #ccc;">Command Processing:</span> 
          <span style="color: #FFC107;">${formatTime(metrics.commandProcessingTime)}</span>
        </div>
        <div style="margin-bottom: 4px;">
          <span style="color: #ccc;">Queue Size:</span> 
          <span style="color: #9C27B0;">${metrics.messageQueueSize}</span>
        </div>
      </div>
      
      <div>
        <h4 style="margin: 0 0 8px 0; color: #FF5722; font-size: 13px;">Physics Engine</h4>
        <div style="margin-bottom: 4px;">
          <span style="color: #ccc;">Physics Step:</span> 
          <span style="color: ${physicsColor}; font-weight: bold;">${formatTime(metrics.physicsStepTime)}</span>
        </div>
        <div style="margin-bottom: 4px;">
          <span style="color: #ccc;">World Step:</span> 
          <span style="color: #FF9800;">${formatTime(metrics.worldStepTime)}</span>
        </div>
        <div style="margin-bottom: 4px;">
          <span style="color: #ccc;">Raycast Time:</span> 
          <span style="color: #E91E63;">${formatTime(metrics.raycastTime)}</span>
        </div>
        <div style="margin-bottom: 4px;">
          <span style="color: #ccc;">Entity Update:</span> 
          <span style="color: #3F51B5;">${formatTime(metrics.entityUpdateTime)}</span>
        </div>
      </div>
    </div>
    
    <div style="margin-top: 15px; border-top: 1px solid #333; padding-top: 12px;">
      <h4 style="margin: 0 0 8px 0; color: #4CAF50; font-size: 13px;">System Resources</h4>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
        <div>
          <div style="margin-bottom: 4px;">
            <span style="color: #ccc;">Server Memory:</span> 
            <span style="color: ${memoryColor}; font-weight: bold;">${formatNumber(metrics.memoryUsage, 1)} MB</span>
          </div>
          <div style="margin-bottom: 4px;">
            <span style="color: #ccc;">CPU Usage:</span> 
            <span style="color: #FF9800;">${formatNumber(metrics.cpuUsage, 1)}%</span>
          </div>
        </div>
        <div>
          <div style="margin-bottom: 4px;">
            <span style="color: #ccc;">Total Entities:</span> 
            <span style="color: #9C27B0;">${metrics.entityCount}</span>
          </div>
          <div style="margin-bottom: 4px;">
            <span style="color: #ccc;">Players:</span> 
            <span style="color: #4CAF50;">${metrics.playerCount}</span>
          </div>
          <div style="margin-bottom: 4px;">
            <span style="color: #ccc;">Dynamic:</span> 
            <span style="color: #2196F3;">${metrics.dynamicEntityCount}</span>
          </div>
        </div>
      </div>
    </div>
    
    <div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid #333; font-size: 10px; color: #666;">
      Last updated: ${new Date(metrics.timestamp).toLocaleTimeString()}
    </div>
    
    <div style="margin-top: 8px; font-size: 10px; color: #666; text-align: center;">
      Press 'P' to toggle this display
    </div>
  `;
};

const toggleDetailedMetrics = (): void => {
  if (!detailedDisplay) {
    detailedDisplay = createDetailedPerformanceUI();
  }

  detailedDisplay.isVisible = !detailedDisplay.isVisible;
  detailedDisplay.container.style.display = detailedDisplay.isVisible ? 'block' : 'none';

  // Update with last known metrics if showing
  if (detailedDisplay.isVisible && detailedDisplay.lastMetrics) {
    updateDetailedMetrics(detailedDisplay.lastMetrics);
  }
};

const getDetailedMetricsDisplay = (): DetailedMetricsDisplay | null => {
  return detailedDisplay;
};

export { updateDetailedMetrics, toggleDetailedMetrics, getDetailedMetricsDisplay };
