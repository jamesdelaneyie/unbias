import { Container, Graphics, Text, BlurFilter, RenderTexture, Sprite } from 'pixi.js';

export interface RadialMenuOption {
  text: string;
  action: () => void;
  color?: number;
}

export interface RadialMenuConfig {
  options: RadialMenuOption[];
  radius?: number;
  centerRadius?: number;
  backgroundColor?: number;
  borderColor?: number;
  textColor?: number;
  fontSize?: number;
}

export class RadialMenu extends Container {
  private options: RadialMenuOption[];
  private radius: number;
  private centerRadius: number;
  private backgroundColor: number;
  private borderColor: number;
  private textColor: number;
  private fontSize: number;
  private isVisible: boolean = false;
  private selectedIndex: number = -1;
  private graphics: Graphics;
  private blurredBackdrop?: Sprite;
  private backdropMask?: Graphics;
  private backdropTexture?: RenderTexture;
  private texts: Text[] = [];
  private centerX: number = 0;
  private centerY: number = 0;
  private lastCaptureX: number = 0;
  private lastCaptureY: number = 0;
  private lastCaptureFrame: number = 0;
  private updateThreshold: number = 5; // pixels
  private updateFrequency: number = 3; // every N frames

  constructor(config: RadialMenuConfig) {
    super();

    this.options = config.options;
    this.radius = config.radius ?? 100;
    this.centerRadius = config.centerRadius ?? 20;
    this.backgroundColor = config.backgroundColor ?? 0x333333;
    this.borderColor = config.borderColor ?? 0xffffff;
    this.textColor = config.textColor ?? 0xffffff;
    this.fontSize = config.fontSize ?? 14;

    this.graphics = new Graphics();
    this.addChild(this.graphics);

    this.visible = false;
    this.interactive = true;
    this.interactiveChildren = true;

    this.createMenu();
  }

  private createMenu(): void {
    if (this.options.length === 0) return;

    const angleStep = (Math.PI * 2) / this.options.length;

    this.graphics.clear();

    // Draw each arc
    for (let i = 0; i < this.options.length; i++) {
      const startAngle = i * angleStep - Math.PI / 2; // Start from top
      const endAngle = (i + 1) * angleStep - Math.PI / 2;

      const option = this.options[i];
      const isSelected = i === this.selectedIndex;
      const color = isSelected ? (option.color ?? 0x555555) : this.backgroundColor;

      // Calculate points for proper donut segment
      const outerStartX = Math.cos(startAngle) * this.radius;
      const outerStartY = Math.sin(startAngle) * this.radius;

      // Draw donut-shaped arc segment with transparent center
      this.graphics
        .moveTo(outerStartX, outerStartY)
        .arc(0, 0, this.radius, startAngle, endAngle)
        .lineTo(Math.cos(endAngle) * this.centerRadius, Math.sin(endAngle) * this.centerRadius)
        .arc(0, 0, this.centerRadius, endAngle, startAngle, true) // Inner arc in reverse
        .closePath()
        .fill({ color })
        .stroke({ color: this.borderColor, width: 1, pixelLine: true });

      // Add text
      const textAngle = startAngle + angleStep / 2;
      const textRadius = this.centerRadius + (this.radius - this.centerRadius) / 2;
      const textX = Math.cos(textAngle) * textRadius;
      const textY = Math.sin(textAngle) * textRadius;

      if (this.texts[i]) {
        this.removeChild(this.texts[i]);
      }

      const text = new Text({
        text: option.text,
        style: {
          fontSize: this.fontSize,
          fill: this.textColor,
          fontFamily: 'Arial',
          align: 'center',
        },
      });

      text.anchor.set(0.5);
      text.x = textX;
      text.y = textY;

      this.texts[i] = text;
      this.addChild(text);
    }

    this.graphics.alpha = 0.5;
    this.graphics.filters = [];
  }

  public show(x: number, y: number): void {
    this.centerX = x;
    this.centerY = y;
    this.x = x;
    this.y = y;
    this.visible = true;
    this.isVisible = true;
    this.selectedIndex = -1;
    this.createMenu();
  }

  public hide(): void {
    this.visible = false;
    this.isVisible = false;
    this.selectedIndex = -1;
    this.destroyBackdrop();
    this.createMenu();
  }

  public createBackdropBlur(worldContainer: Container, app: any): void {
    // Clean up previous backdrop
    this.destroyBackdrop();

    // Create reusable render texture
    this.backdropTexture = RenderTexture.create({
      width: app.screen.width,
      height: app.screen.height,
    });

    // Initial capture
    this.updateBackdropBlur(worldContainer, app, true);
  }

  public updateBackdropBlur(worldContainer: Container, app: any, force: boolean = false): void {
    if (!this.backdropTexture || !this.isVisible) return;

    const currentFrame = app.ticker.lastTime;
    const dx = Math.abs(this.centerX - this.lastCaptureX);
    const dy = Math.abs(this.centerY - this.lastCaptureY);
    const distance = Math.sqrt(dx * dx + dy * dy);
    const framesPassed = currentFrame - this.lastCaptureFrame;

    // Only update if:
    // 1. Forced update (initial)
    // 2. Moved enough distance
    // 3. Enough frames have passed
    if (!force && distance < this.updateThreshold && framesPassed < this.updateFrequency) {
      return;
    }

    // Temporarily hide UI elements to avoid capturing them
    const uiContainer = app.stage.getChildByLabel?.('UserInterfaceContainer');
    const originalUIVisible = uiContainer?.visible;
    if (uiContainer) {
      uiContainer.visible = false;
    }

    // Render the stage without UI to the existing texture
    app.renderer.render({ container: app.stage, target: this.backdropTexture });

    // Restore UI visibility
    if (uiContainer && originalUIVisible !== undefined) {
      uiContainer.visible = originalUIVisible;
    }

    // Create or update sprite from the captured texture
    if (!this.blurredBackdrop) {
      this.blurredBackdrop = new Sprite(this.backdropTexture);
      this.blurredBackdrop.filters = [new BlurFilter({ strength: 10, quality: 4 })];

      // Create mask for the circle shape
      this.backdropMask = new Graphics();
      this.backdropMask
        .circle(0, 0, this.radius)
        //.cut()
        //.circle(0, 0, this.centerRadius)
        .fill({ color: 0xffffff });

      // Apply mask to backdrop
      this.blurredBackdrop.mask = this.backdropMask;

      // Add backdrop behind menu graphics
      this.addChildAt(this.blurredBackdrop, 0);
      this.addChild(this.backdropMask);
    }

    // Update position
    this.blurredBackdrop.x = -this.centerX;
    this.blurredBackdrop.y = -this.centerY;

    // Update tracking variables
    this.lastCaptureX = this.centerX;
    this.lastCaptureY = this.centerY;
    this.lastCaptureFrame = currentFrame;
  }

  private destroyBackdrop(): void {
    if (this.blurredBackdrop) {
      this.blurredBackdrop.destroy();
      this.blurredBackdrop = undefined;
    }

    if (this.backdropMask) {
      this.backdropMask.destroy();
      this.backdropMask = undefined;
    }

    if (this.backdropTexture) {
      this.backdropTexture.destroy(true);
      this.backdropTexture = undefined;
    }
  }

  public updateSelection(mouseX: number, mouseY: number): void {
    if (!this.isVisible) return;

    const dx = mouseX - this.centerX;
    const dy = mouseY - this.centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < this.centerRadius || distance > this.radius) {
      this.selectedIndex = -1;
    } else {
      // Calculate angle from center
      let angle = Math.atan2(dy, dx) + Math.PI / 2; // Adjust for starting from top
      if (angle < 0) angle += Math.PI * 2;

      const angleStep = (Math.PI * 2) / this.options.length;
      this.selectedIndex = Math.floor(angle / angleStep);

      if (this.selectedIndex >= this.options.length) {
        this.selectedIndex = this.options.length - 1;
      }
    }

    this.createMenu();
  }

  public executeSelected(): void {
    if (this.selectedIndex >= 0 && this.selectedIndex < this.options.length) {
      this.options[this.selectedIndex].action();
    }
  }

  public updateConfig(config: Partial<RadialMenuConfig>): void {
    if (config.options) this.options = config.options;
    if (config.radius !== undefined) this.radius = config.radius;
    if (config.centerRadius !== undefined) this.centerRadius = config.centerRadius;
    if (config.backgroundColor !== undefined) this.backgroundColor = config.backgroundColor;
    if (config.borderColor !== undefined) this.borderColor = config.borderColor;
    if (config.textColor !== undefined) this.textColor = config.textColor;
    if (config.fontSize !== undefined) this.fontSize = config.fontSize;

    // Clear existing texts
    this.texts.forEach(text => this.removeChild(text));
    this.texts = [];

    // Clear graphics
    this.graphics.clear();

    this.createMenu();
  }
}
