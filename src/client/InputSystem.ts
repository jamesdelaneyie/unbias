/*
InputSystem is responsible for handling user input from the keyboard and mouse.
It is responsible for translating the input into a command that can be sent to the server.
*/
type BooleanKeys = 'w' | 'a' | 's' | 'd';
type KeyMapping = {
  [key: string]: BooleanKeys;
};
type InputState = {
  w: boolean;
  s: boolean;
  a: boolean;
  d: boolean;
  mx: number;
  my: number;
  rotation: number;
};

export class InputSystem {
  frameState: InputState;
  currentState: InputState;
  private keyMapping: KeyMapping = {
    w: 'w',
    ArrowUp: 'w',
    s: 's',
    ArrowDown: 's',
    a: 'a',
    ArrowLeft: 'a',
    d: 'd',
    ArrowRight: 'd',
  };
  constructor() {
    this.currentState = {
      w: false,
      s: false,
      a: false,
      d: false,
      rotation: 0,
      mx: 0,
      my: 0,
    };

    this.frameState = { ...this.currentState };

    document.addEventListener('keydown', (event: KeyboardEvent) => {
      const stateKey = this.keyMapping[event.key];
      if (stateKey) {
        this.currentState[stateKey] = true;
        this.frameState[stateKey] = true;
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

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.resetKeys();
      }
    });
  }

  releaseKeys() {
    Object.assign(this.frameState, this.currentState);
  }
  resetKeys() {
    this.currentState = {
      w: false,
      s: false,
      a: false,
      d: false,
      rotation: this.currentState.rotation,
      mx: this.currentState.mx,
      my: this.currentState.my,
    };
  }
}
