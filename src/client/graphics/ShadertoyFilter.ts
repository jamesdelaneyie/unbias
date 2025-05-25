import { Filter, GlProgram } from 'pixi.js';

const vertex = `#version 300 es
  in vec2 aPosition;
  out vec2 vTextureCoord;

  uniform vec4 uInputSize;
  uniform vec4 uOutputFrame;
  uniform vec4 uOutputTexture;

  vec4 filterVertexPosition( void )
  {
      vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;

      position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;
      position.y = position.y * (2.0*uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;

      return vec4(position, 0.0, 1.0);
  }

  vec2 filterTextureCoord( void )
  {
      return aPosition * (uOutputFrame.zw * uInputSize.zw);
  }

  void main(void)
  {
      gl_Position = filterVertexPosition();
      vTextureCoord = filterTextureCoord();
  }
`;

const fragment = `#version 300 es
  precision highp float;
  
  in vec2 vTextureCoord;
  out vec4 fragColor;
  
  uniform sampler2D uTexture;
  uniform float uTime;
  uniform vec2 uResolution;

  void main(void)
  {
      // Convert PIXI texture coordinates to Shadertoy fragCoord format
      vec2 fragCoord = vTextureCoord * uResolution;
      
      // Original Shadertoy code converted to PIXI format
      float an = sin(uTime) / 3.14157;
      float as = sin(an);
      float zoo = 0.23232 + 0.38 * sin(0.7 * uTime);

      vec2 position = (fragCoord.xy / uResolution.xy * 5.3);

      float color = 0.0;
      color += sin(position.x - position.y);
      color += sin(uTime) * cos(sin(uTime) * position.y * position.x * sin(position.x)) + 0.008;
      color += sin(uTime) + position.x * sin(position.y * sin(sin(tan(cos(uTime)))));
      
      vec3 finalColor = vec3(sin(color * color) * 4.0, sin(color * color), color) * sin(uTime + position.x / (uTime * 3.14));
      float alpha = uTime / 10.828;
      
      // Sample the original texture and blend with the effect
      vec4 originalTexture = texture(uTexture, vTextureCoord);
      
      fragColor = vec4(finalColor, alpha) * originalTexture.a;
  }
`;

export class ShadertoyFilter extends Filter {
  constructor() {
    super({
      glProgram: new GlProgram({
        fragment,
        vertex,
      }),
      resources: {
        timeUniforms: {
          uTime: { value: 0.0, type: 'f32' },
          uResolution: { value: [512.0, 512.0], type: 'vec2<f32>' },
        },
      },
    });
  }

  get time(): number {
    return this.resources.timeUniforms.uniforms.uTime;
  }

  set time(value: number) {
    this.resources.timeUniforms.uniforms.uTime = value;
  }

  updateResolution(width: number, height: number): void {
    this.resources.timeUniforms.uniforms.uResolution = [width, height];
  }
}
