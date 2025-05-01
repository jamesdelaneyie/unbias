import { Client } from 'nengi';
import { addNotification, addUsernameField, setupUsername } from '@/client/HTMLUI';
import { worldConfig } from '@/common/worldConfig';

let reconnectAttempts = 0;
let reconnectTimeout: number | null = null;

const connectToServer = async (client: Client, notificationBox: HTMLDivElement) => {
  try {
    const res = await client.connect('ws://localhost:9001', { token: 12345 });
    if (res === 'accepted') {
      addNotification(
        document,
        notificationBox,
        reconnectAttempts > 0 ? 'Reconnected to server' : 'Connected to server'
      );
      reconnectAttempts = 0;
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
      }

      // Show username field and handle username
      const usernameField = addUsernameField(document, notificationBox);
      setupUsername(usernameField, client);
      return true;
    } else {
      addNotification(document, notificationBox, 'Connection error');
      return false;
    }
  } catch (err) {
    console.warn(err);
    addNotification(document, notificationBox, 'Connection error');
    return false;
  }
};

const scheduleReconnect = (client: Client, notificationBox: HTMLDivElement) => {
  if (reconnectAttempts >= worldConfig.maxReconnectAttempts) {
    addNotification(document, notificationBox, 'Max reconnection attempts reached');
    return;
  }
  reconnectAttempts++;
  addNotification(
    document,
    notificationBox,
    `Attempting to reconnect (${reconnectAttempts}/${worldConfig.maxReconnectAttempts})...`
  );
  reconnectTimeout = window.setTimeout(async () => {
    const success = await connectToServer(client, notificationBox);
    if (!success) {
      scheduleReconnect(client, notificationBox);
    }
  }, worldConfig.reconnectDelay);
};

export { connectToServer, scheduleReconnect };
