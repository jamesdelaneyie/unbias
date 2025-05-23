import { Client } from 'nengi';
import { config } from '@/common/config';
import { notificationService, NotificationType } from '@/client/UIManager';

let reconnectAttempts = 0;
let reconnectTimeout: number | null = null;

const connectToServer = async (client: Client) => {
  try {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const hostArray = host.split(':');

    const port = 9001; // Includes port if non-standard (e.g., yourdomain.com:9001)
    const wsUrl = `${protocol}//${hostArray[0]}:${port}/`; // Assumes WebSocket is at the root path via Nginx
    console.log('Connecting to server at:', wsUrl);
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
  if (reconnectAttempts >= config.maxReconnectAttempts) {
    notificationService.addNotification(
      'Max reconnection attempts reached',
      NotificationType.ERROR
    );
    return;
  }
  reconnectAttempts++;
  notificationService.addNotification(
    `Attempting to reconnect (${reconnectAttempts}/${config.maxReconnectAttempts})...`,
    NotificationType.INFO
  );
  reconnectTimeout = window.setTimeout(async () => {
    const success = await connectToServer(client);
    if (!success) {
      scheduleReconnect(client);
    }
  }, config.reconnectDelay);
};

export { connectToServer, scheduleReconnect };
