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

    this.frameState = {
      w: false,
      s: false,
      a: false,
      d: false,
      rotation: 0,
      mx: 0,
      my: 0,
    };

    document.addEventListener('keydown', event => {
      // up
      if (event.key === 'w' || event.key === 'ArrowUp') {
        this.currentState.w = true;
        this.frameState.w = true;
      }
      // down
      if (event.key === 's' || event.key === 'ArrowDown') {
        this.currentState.s = true;
        this.frameState.s = true;
      }
      //left
      if (event.key === 'a' || event.key === 'ArrowLeft') {
        this.currentState.a = true;
        this.frameState.a = true;
      }
      // right
      if (event.key === 'd' || event.key === 'ArrowRight') {
        this.currentState.d = true;
        this.frameState.d = true;
      }
    });

    document.addEventListener('keyup', event => {
      if (event.key === 'w' || event.key === 'ArrowUp') {
        this.currentState.w = false;
      }
      if (event.key === 'a' || event.key === 'ArrowLeft') {
        this.currentState.a = false;
      }
      if (event.key === 's' || event.key === 'ArrowDown') {
        this.currentState.s = false;
      }
      if (event.key === 'd' || event.key === 'ArrowRight') {
        this.currentState.d = false;
      }
    });

    document.addEventListener('mousemove', event => {
      this.currentState.mx = event.clientX;
      this.currentState.my = event.clientY;
    });
  }

  releaseKeys() {
    this.frameState.w = this.currentState.w;
    this.frameState.a = this.currentState.a;
    this.frameState.s = this.currentState.s;
    this.frameState.d = this.currentState.d;
    this.frameState.rotation = this.currentState.rotation;
  }
}
