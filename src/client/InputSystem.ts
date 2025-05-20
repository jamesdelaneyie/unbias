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
    });

    document.addEventListener('mousedown', () => {
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
    });

    document.addEventListener('mouseup', () => {
      this.currentState.leftClick = false;
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

    if (this.shotQueuedForNextFrame) {
      this.frameState.leftClick = true;
      this.shotQueuedForNextFrame = false;
    } else {
      this.frameState.leftClick = false;
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
    };
    this.shotQueuedForNextFrame = false;
  }
}
