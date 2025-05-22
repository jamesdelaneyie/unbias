import { NetworkType } from '@/common/NetworkType';
import { Client } from 'nengi';
import { Application, Container, Graphics, HTMLText, HTMLTextStyle } from 'pixi.js';
import { ScrollBox, Input } from '@pixi/ui';
import { LayoutContainer } from '@pixi/layout/components';
import { ServerMessageType } from '@/common/schemas/serverMessageSchema';

enum NotificationType {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  SUCCESS = 'success',
}

interface QueuedMessage {
  message: string;
  notificationType: NotificationType;
  messageType: ServerMessageType;
}

class NotificationService {
  // --- HTML bits (username field) -----------------------------
  private notificationBox: HTMLDivElement;

  private scrollBox?: ScrollBox;
  private autoScroll = true;
  private readonly maxMessages = 200;
  private readonly pending: QueuedMessage[] = [];
  private pixiReady = false;
  private containerWidth = 400;
  private containerHeight = 100;
  private uiContainer?: Container;

  constructor(document: Document) {
    // HTML container only used for the username text field for now
    this.notificationBox = this.createNotificationBox(document);
    document.body.appendChild(this.notificationBox);
  }

  setupPixi(app: Application, client: Client): void {
    if (this.pixiReady) return;

    // Find the top-level UI container that setupUI already creates.
    this.uiContainer = app.stage.getChildByLabel?.('UserInterfaceContainer') as Container;
    if (!this.uiContainer) {
      // Fallback: just add straight to stage.
      console.warn('[NotificationService] Could not find UserInterfaceContainer, adding to stage');
    }

    // pixi/layout LayoutContainer
    const notificationContainer = new LayoutContainer({
      layout: {
        width: this.containerWidth,
        height: this.containerHeight,
        padding: 5,
        flexDirection: 'column',
        backgroundColor: 0x333333,
        borderRadius: 5,
      },
    });
    notificationContainer.label = 'NotificationContainer';
    notificationContainer.zIndex = 1000;

    // pixi/ui ScrollBox
    const scrollBox = new ScrollBox({
      width: this.containerWidth,
      height: this.containerHeight,
      globalScroll: false,
    });
    scrollBox.label = 'NotificationScrollBox';
    scrollBox.layout = true;
    scrollBox.list.type = 'vertical';

    notificationContainer.addChild(scrollBox);

    this.addPixiInput(app, client);

    (this.uiContainer ?? app.stage).addChild(notificationContainer);

    // Track pointer/wheel interaction so we only auto-scroll if the user is at bottom
    scrollBox.on('wheel', () => {
      this.autoScroll = this.isAtBottom();
    });
    scrollBox.on('pointerdown', () => {
      this.autoScroll = this.isAtBottom();
    });

    this.scrollBox = scrollBox;
    this.pixiReady = true;

    // Flush messages that arrived before Pixi was ready
    this.pending.forEach(msg =>
      this.addNotification(msg.message, msg.notificationType, msg.messageType)
    );
    this.pending.length = 0;
  }

  /**
   * Push a message to the on-screen log
   */
  addNotification(
    message: string,
    notificationType: NotificationType = NotificationType.INFO,
    messageType: ServerMessageType = ServerMessageType.global
  ): void {
    if (!this.pixiReady || !this.scrollBox) {
      // Defer until Pixi is ready
      this.pending.push({ message, notificationType, messageType });
      return;
    }

    const hoursMinsSeconds = new Date().toLocaleTimeString('en-GB', { hour12: false });
    const milliseconds = String(new Date().getMilliseconds()).padStart(3, '0');
    const timestamp = `${hoursMinsSeconds}.${milliseconds}`;

    const color = this.getColor(notificationType);
    const messageTypeStr = ServerMessageType[messageType];

    const timeString = `<time>[${timestamp}]</time>`;
    const messageTypeString = `<${messageTypeStr}>[${messageTypeStr}]</${messageTypeStr}>`;
    const messageString = `<span style="color:${color}">${message}</span>`;

    const htmlStr = `${timeString}${messageTypeString}: ${messageString}`;

    const style = new HTMLTextStyle({
      fill: 'white',
      fontSize: 10,
      lineHeight: 12,
      padding: 4,
      fontFamily: 'monospace',
      wordWrap: true,
      wordWrapWidth: this.containerWidth - 10,
      tagStyles: {
        time: {
          fill: 'white',
        },
        global: {
          fill: 'yellow',
        },
        local: {
          fill: '0x05e246',
        },
        private: {
          fill: 'red',
        },
      },
    });

    style.addOverride('font-smoothing: antialiased');
    style.addOverride('-webkit-font-smoothing: antialiased');

    const htmlText = new HTMLText({
      text: htmlStr,
      style: style,
    });

    this.scrollBox.addItem(htmlText);

    const content = (this.scrollBox as any).content ?? this.scrollBox;
    while (content.children.length > this.maxMessages) {
      content.removeChildAt(0);
    }

    this.scrollBox.scrollBottom();
  }

  /**
   * Remove every displayed message.
   */
  clearAll(): void {
    if (this.scrollBox) {
      const content = (this.scrollBox as any).content ?? this.scrollBox;
      content.removeChildren();
    }
    this.pending.length = 0;
  }

  /**
   * Username helpers (HTML) – kept from original implementation
   */
  addUsernameField(document: Document): HTMLInputElement {
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'enter username';
    input.style.fontSize = '11px';
    input.style.margin = '10px 0';
    this.notificationBox.appendChild(input);
    return input;
  }

  addPixiInput(app: Application, client: Client): void {
    //width and height are set by the background
    const width: number = 150;
    const height: number = 30;
    const fontSize: number = 15;
    const inputBackground = new Graphics().rect(0, 0, width, height).fill({ color: 0xffffff });
    const input = new Input({
      bg: inputBackground,
      padding: 5,
      placeholder: 'enter username',
      addMask: true,
      textStyle: {
        fontSize: fontSize,
        fontFamily: 'monospace',
        fill: 0x333333,
      },
    });
    input.label = 'UsernameInput';
    input.y = app.screen.height - (height + 10);
    input.x = app.screen.width / 2 - width / 2;
    (this.uiContainer ?? app.stage).addChild(input);
    input.interactive = true;
    input.onEnter.connect((text: string) => {
      const username = text.trim();
      input.value = '';
      if (username) {
        localStorage.setItem('username', username);
        client.addCommand({
          ntype: NetworkType.UsernameCommand,
          username,
        });
      }
    });
    input.onChange.connect((text: string) => {
      console.log('change', text);
    });
  }

  setupUsername(usernameField: HTMLInputElement, client: Client): void {
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

  /* -----------------------------------------------------------
   *  Internals
   * ---------------------------------------------------------*/

  private createNotificationBox(document: Document): HTMLDivElement {
    const box = document.createElement('div');
    box.style.position = 'absolute';
    box.style.top = '10px';
    box.style.right = '10px';
    box.style.width = '300px';
    box.style.zIndex = '1000';
    return box;
  }

  private getColor(type: NotificationType): string {
    switch (type) {
      case NotificationType.ERROR:
        return '#f44336';
      case NotificationType.WARNING:
        return '#ffeb3b';
      case NotificationType.SUCCESS:
        return '#4caf50';
      default:
        return '#cccccc';
    }
  }

  /**
   * Checks if the user is currently scrolled to the bottom (or near it).
   */
  private isAtBottom(): boolean {
    if (!this.scrollBox) return true;
    // Generic fallback: compare scrollable height vs current offset
    const maxY = (this.scrollBox as any).maxScrollY ?? 0;
    const currentY = (this.scrollBox as any).scrollY ?? 0;
    return Math.abs(maxY - currentY) < 2; // within 2px tolerance
  }
}

// Single global instance (still created eagerly for username input)
export const notificationService = new NotificationService(document);
export { NotificationType };
