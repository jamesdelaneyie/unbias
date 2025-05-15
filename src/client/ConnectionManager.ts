import { Client } from 'nengi';
import { worldConfig } from '@/common/worldConfig';
import { notificationService, NotificationType } from '@/client/NotificationService';

let reconnectAttempts = 0;
let reconnectTimeout: number | null = null;

const connectToServer = async (client: Client) => {
  try {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host; // Includes port if non-standard (e.g., yourdomain.com:9001)
    const wsUrl = `${protocol}//${host}/`; // Assumes WebSocket is at the root path via Nginx

    const res = await client.connect(wsUrl, { token: 12345 });
    if (res === 'accepted') {
      notificationService.addNotification(
        reconnectAttempts > 0 ? 'Reconnected to server' : 'Connected to server',
        NotificationType.INFO
      );
      reconnectAttempts = 0;
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
      }

      // Show username field and handle username
      const usernameField = notificationService.addUsernameField(document);
      notificationService.setupUsername(usernameField, client);
      return true;
    } else {
      notificationService.addNotification('Connection error', NotificationType.ERROR);
      return false;
    }
  } catch (err) {
    console.warn(err);
    notificationService.addNotification('Connection error', NotificationType.ERROR);
    return false;
  }
};

const scheduleReconnect = (client: Client) => {
  if (reconnectAttempts >= worldConfig.maxReconnectAttempts) {
    notificationService.addNotification(
      'Max reconnection attempts reached',
      NotificationType.ERROR
    );
    return;
  }
  reconnectAttempts++;
  notificationService.addNotification(
    `Attempting to reconnect (${reconnectAttempts}/${worldConfig.maxReconnectAttempts})...`,
    NotificationType.INFO
  );
  reconnectTimeout = window.setTimeout(async () => {
    const success = await connectToServer(client);
    if (!success) {
      scheduleReconnect(client);
    }
  }, worldConfig.reconnectDelay);
};

export { connectToServer, scheduleReconnect };
