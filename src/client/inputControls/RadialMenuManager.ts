import { Application, Container } from 'pixi.js';
import { RadialMenu, RadialMenuOption, RadialMenuConfig } from './RadialMenu';
import { InputSystem } from './InputSystem';
import { notificationService, NotificationType } from '../UIManager';
import { ServerMessageType } from '@/common/schemas/serverMessageSchema';

export class RadialMenuManager {
  private radialMenu: RadialMenu;
  private uiContainer: Container;
  private isMenuActive: boolean = false;
  private app: Application;
  private worldContainer?: Container;

  constructor(app: Application) {
    this.app = app;

    // Find or create UI container
    this.uiContainer = app.stage.getChildByLabel?.('UserInterfaceContainer') as Container;
    if (!this.uiContainer) {
      this.uiContainer = new Container();
      this.uiContainer.label = 'UserInterfaceContainer';
      this.uiContainer.zIndex = 1000;
      app.stage.addChild(this.uiContainer);
    }

    // Create default radial menu with placeholder options
    const defaultOptions: RadialMenuOption[] = [
      {
        text: 'Rifle',
        action: () => {
          notificationService.addNotification(
            'Rifle action triggered',
            NotificationType.INFO,
            ServerMessageType.local
          );
          console.log('Rifle action executed');
        },
        color: 0x4caf50,
      },
      {
        text: 'Laser',
        action: () => {
          notificationService.addNotification(
            'Laser action triggered',
            NotificationType.INFO,
            ServerMessageType.local
          );
          console.log('Laser action executed');
        },
        color: 0xf44336,
      },
      {
        text: 'Grenade',
        action: () => {
          notificationService.addNotification(
            'Grenade action triggered',
            NotificationType.INFO,
            ServerMessageType.local
          );
          console.log('Grenade action executed');
        },
        color: 0x2196f3,
      },
    ];

    const config: RadialMenuConfig = {
      options: defaultOptions,
      radius: 120,
      centerRadius: 25,
      backgroundColor: 0x333333,
      borderColor: 0xffffff,
      textColor: 0xffffff,
      fontSize: 12,
    };

    this.radialMenu = new RadialMenu(config);
    this.uiContainer.addChild(this.radialMenu);
  }

  public setWorldContainer(worldContainer: Container): void {
    this.worldContainer = worldContainer;
  }

  public handleInput(inputSystem: InputSystem): void {
    const input = inputSystem.frameState;

    // Show menu on right click
    if (input.rightClick && !this.isMenuActive) {
      this.showMenu(input.mx, input.my);
    }

    // Update selection while holding right click
    if (input.rightClickHeld && this.isMenuActive) {
      this.radialMenu.updateSelection(input.mx, input.my);

      // Update backdrop blur as mouse moves
      if (this.worldContainer) {
        this.radialMenu.updateBackdropBlur(this.worldContainer, this.app);
      }
    }

    // Execute selected action when releasing right click
    if (!input.rightClickHeld && this.isMenuActive) {
      this.radialMenu.executeSelected();
      this.hideMenu();
    }
  }

  private showMenu(x: number, y: number): void {
    this.radialMenu.show(x, y);

    // Create backdrop blur if world container is available
    if (this.worldContainer) {
      this.radialMenu.createBackdropBlur(this.worldContainer, this.app);
    }

    this.isMenuActive = true;
  }

  private hideMenu(): void {
    this.radialMenu.hide();
    this.isMenuActive = false;
  }

  public updateMenuOptions(options: RadialMenuOption[]): void {
    this.radialMenu.updateConfig({ options });
  }

  public updateMenuConfig(config: Partial<RadialMenuConfig>): void {
    this.radialMenu.updateConfig(config);
  }

  public isActive(): boolean {
    return this.isMenuActive;
  }

  public updateBackdrop(): void {
    if (this.isMenuActive && this.worldContainer) {
      this.radialMenu.updateBackdropBlur(this.worldContainer, this.app);
    }
  }
}
