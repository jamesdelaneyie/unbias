import { NetworkType } from '@/common/NType';
import { Client } from 'nengi';

enum NotificationType {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  SUCCESS = 'success',
}

class NotificationService {
  private notificationBox: HTMLDivElement;
  private notificationCount = 0;
  private maxNotifications = 5;

  constructor(document: Document) {
    this.notificationBox = this.createNotificationBox(document);
    document.body.appendChild(this.notificationBox);
  }

  private createNotificationBox(document: Document): HTMLDivElement {
    const box = document.createElement('div');
    box.style.position = 'absolute';
    box.style.top = '10px';
    box.style.right = '10px';
    box.style.width = '300px';
    box.style.zIndex = '1000';
    return box;
  }

  addUsernameField(document: Document) {
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'enter username';
    input.style.fontSize = '11px';
    input.style.margin = '10px 0';
    this.notificationBox.appendChild(input);
    return input;
  }

  setupUsername(usernameField: HTMLInputElement, client: Client) {
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
  }

  addNotification(
    message: string,
    type: NotificationType = NotificationType.INFO,
    duration: number = 5000
  ): void {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    // Style based on type
    notification.style.fontSize = '11px';
    notification.style.fontFamily = 'monospace';
    notification.style.padding = '5px';
    notification.style.marginBottom = '5px';
    notification.style.borderRadius = '5px';
    notification.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
    notification.style.opacity = '0';
    notification.style.transition = 'opacity 0.3s ease-in-out';

    switch (type) {
      case NotificationType.ERROR:
        notification.style.backgroundColor = '#ffdddd';
        notification.style.borderLeft = '4px solid #f44336';
        break;
      case NotificationType.WARNING:
        notification.style.backgroundColor = '#ffffcc';
        notification.style.borderLeft = '4px solid #ffeb3b';
        break;
      case NotificationType.SUCCESS:
        notification.style.backgroundColor = '#ddffdd';
        notification.style.borderLeft = '4px solid #4caf50';
        break;
      default:
        notification.style.backgroundColor = '#e7f3fe';
        notification.style.borderLeft = '4px solid #2196f3';
    }

    // Limit the number of notifications
    if (this.notificationBox.children.length >= this.maxNotifications) {
      this.notificationBox.removeChild(this.notificationBox.firstChild!);
    }

    this.notificationBox.appendChild(notification);

    // Fade in
    setTimeout(() => {
      notification.style.opacity = '1';
    }, 10);

    // Auto remove after duration
    if (duration > 0) {
      setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
          if (notification.parentNode === this.notificationBox) {
            this.notificationBox.removeChild(notification);
          }
        }, 300);
      }, duration);
    }
  }

  clearAll(): void {
    while (this.notificationBox.firstChild) {
      this.notificationBox.removeChild(this.notificationBox.firstChild);
    }
  }

  getNotificationBox(): HTMLDivElement {
    return this.notificationBox;
  }
}

export const notificationService = new NotificationService(document);
export { NotificationType };
