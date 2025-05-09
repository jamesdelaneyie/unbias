import { Client } from 'nengi';
import { NetworkType } from '@/common/NType';
import { ligtenColor } from '@/common/utils';

const createNotificationBox = (document: Document) => {
  const notificationBox = document.createElement('div');
  notificationBox.style.position = 'fixed';
  notificationBox.style.top = '10px';
  notificationBox.style.right = '10px';
  notificationBox.style.width = '300px';
  notificationBox.style.maxHeight = '500px';
  notificationBox.style.overflowY = 'auto';
  notificationBox.style.backgroundColor = 'rgba(0,0,0,0.8)';
  notificationBox.style.color = 'white';
  notificationBox.style.padding = '10px';
  notificationBox.style.borderRadius = '2px';
  notificationBox.style.fontFamily = 'monospace';
  notificationBox.style.fontSize = '10px';
  notificationBox.style.zIndex = '1000';
  document.body.appendChild(notificationBox);
  return notificationBox;
};

const addNotification = (document: Document, box: HTMLDivElement, message: string) => {
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.style.borderBottom = '1px solid rgba(255,255,255,0.2)';
  notification.style.padding = '5px 0';
  box.appendChild(notification);
  box.scrollTop = box.scrollHeight;
};

const addUsernameField = (document: Document, box: HTMLDivElement) => {
  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'enter username';
  input.style.fontSize = '11px';
  input.style.margin = '10px 0';
  box.appendChild(input);
  return input;
};

const setupUsername = (usernameField: HTMLInputElement, client: Client) => {
  const existingUsername = localStorage.getItem('username') || '';
  if (existingUsername) {
    console.log('existingUsername', existingUsername);
    /*usernameField.value = existingUsername;
    client.addCommand({
      ntype: NType.UsernameCommand,
      username: existingUsername,
    });*/
  }

  let usernameSubmitted = false;
  usernameField.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !usernameSubmitted) {
      const username = (e.target as HTMLInputElement).value.trim();
      if (username) {
        usernameSubmitted = true;
        localStorage.setItem('username', username);
        client.addCommand({
          ntype: NetworkType.UsernameCommand,
          username,
        });
        usernameField.disabled = true;
      }
    }
  });
};

export { ligtenColor, createNotificationBox, addNotification, addUsernameField, setupUsername };
