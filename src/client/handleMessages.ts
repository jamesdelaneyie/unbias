import { NetworkType } from '@/common/NetworkType';
import { Client } from 'nengi';
import { NotificationService, NotificationType } from './UIManager';
import { Container } from 'pixi.js';
import { drawHitscan } from './graphics/drawHitscan';
import { updateServerMetrics } from './performanceUI';
import { updateDetailedMetrics } from './DetailedPerformanceUI';

export const handleMessages = (
  client: Client,
  notificationService: NotificationService,
  worldState: any,
  worldContainer: Container
) => {
  while (client.network.messages.length > 0) {
    const message = client.network.messages.pop();
    console.log('Received message:', message);
    if (message.ntype === NetworkType.IdentityMessage) {
      worldState.myId = message.myId;
    }
    if (message.ntype === NetworkType.ShotImpactMessage) {
      drawHitscan(worldContainer, message.fromX, message.fromY, message.x, message.y, 0x0000ff);
    }
    if (message.ntype === NetworkType.ServerMessage) {
      notificationService.addNotification(message.message, NotificationType.INFO, message.type);
    }
    if (message.ntype === NetworkType.PerformanceMetrics) {
      updateServerMetrics(message);
      updateDetailedMetrics(message);
    }
  }
};
