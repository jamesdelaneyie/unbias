/*
InputSystem is responsible for handling user input from the keyboard and mouse.
It is responsible for translating the input into a command that can be sent to the server.
*/
type BooleanKeys = 'w' | 'a' | 's' | 'd' | 'space';
type KeyMapping = {
  [key: string]: BooleanKeys;
};
type InputState = {
  w: boolean;
  s: boolean;
  a: boolean;
  d: boolean;
  space: boolean;
  mx: number;
  my: number;
  rotation: number;
  leftClick: boolean;
  rightClick: boolean;
  rightClickHeld: boolean;
};

export class InputSystem {
  frameState: InputState;
  currentState: InputState;
  private lastShotTime: number;
  private shotCooldown: number = 500;
  private keyMapping: KeyMapping = {
    w: 'w',
    ArrowUp: 'w',
    s: 's',
    ArrowDown: 's',
    a: 'a',
    ArrowLeft: 'a',
    d: 'd',
    ArrowRight: 'd',
    Space: 'space',
    ' ': 'space',
  };
  private shotQueuedForNextFrame: boolean = false;
  private onMouseMoveCallback?: (x: number, y: number) => void;

  constructor() {
    this.lastShotTime = 0;

    this.currentState = {
      w: false,
      s: false,
      a: false,
      d: false,
      space: false,
      rotation: 0,
      mx: 0,
      my: 0,
      leftClick: false,
      rightClick: false,
      rightClickHeld: false,
    };

    this.frameState = { ...this.currentState };

    document.addEventListener('keydown', (event: KeyboardEvent) => {
      const stateKey = this.keyMapping[event.key];
      if (stateKey) {
        this.currentState[stateKey] = true;
      }
    });

    document.addEventListener('keyup', (event: KeyboardEvent) => {
      const stateKey = this.keyMapping[event.key];
      if (stateKey) {
        this.currentState[stateKey] = false;
      }
    });

    document.addEventListener('mousemove', (event: MouseEvent) => {
      this.currentState.mx = event.clientX;
      this.currentState.my = event.clientY;

      // Call callback immediately for instant crosshairs update
      if (this.onMouseMoveCallback) {
        this.onMouseMoveCallback(event.clientX, event.clientY);
      }
    });

    document.addEventListener('mousedown', (event: MouseEvent) => {
      if (event.button === 0) {
        // Left click
        this.currentState.leftClick = true;
        const now = Date.now();
        if (now - this.lastShotTime >= this.shotCooldown) {
          this.shotQueuedForNextFrame = true;
          this.lastShotTime = now;
        } else {
          console.log(
            'Shot cooldown not met. Now:',
            now,
            'LastShotTime:',
            this.lastShotTime,
            'Diff:',
            now - this.lastShotTime
          );
        }
      } else if (event.button === 2) {
        // Right click
        event.preventDefault();
        this.currentState.rightClick = true;
        this.currentState.rightClickHeld = true;
      }
    });

    document.addEventListener('mouseup', (event: MouseEvent) => {
      if (event.button === 0) {
        // Left click
        this.currentState.leftClick = false;
      } else if (event.button === 2) {
        // Right click
        this.currentState.rightClickHeld = false;
      }
    });

    document.addEventListener('contextmenu', (event: MouseEvent) => {
      event.preventDefault(); // Prevent default context menu
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.resetKeys();
      }
    });
  }

  prepareFrameInput() {
    this.frameState.w = this.currentState.w;
    this.frameState.s = this.currentState.s;
    this.frameState.a = this.currentState.a;
    this.frameState.d = this.currentState.d;
    this.frameState.space = this.currentState.space;
    this.frameState.mx = this.currentState.mx;
    this.frameState.my = this.currentState.my;
    this.frameState.rotation = this.currentState.rotation;
    this.frameState.rightClickHeld = this.currentState.rightClickHeld;

    if (this.shotQueuedForNextFrame) {
      this.frameState.leftClick = true;
      this.shotQueuedForNextFrame = false;
    } else {
      this.frameState.leftClick = false;
    }

    // Handle right click - set to true only on the frame it was pressed
    if (this.currentState.rightClick) {
      this.frameState.rightClick = true;
      this.currentState.rightClick = false; // Reset for next frame
    } else {
      this.frameState.rightClick = false;
    }
  }

  resetKeys() {
    this.currentState = {
      w: false,
      s: false,
      a: false,
      d: false,
      space: false,
      rotation: this.currentState.rotation,
      mx: this.currentState.mx,
      my: this.currentState.my,
      leftClick: false,
      rightClick: false,
      rightClickHeld: false,
    };
    this.shotQueuedForNextFrame = false;
  }

  setOnMouseMoveCallback(callback: (x: number, y: number) => void) {
    this.onMouseMoveCallback = callback;
  }
}
