import { Container } from 'pixi.js';
import TaggedTextPlus from 'pixi-tagged-text-plus';

const drawBasicText = (masterContainer: Container, text: string, x: number, y: number) => {
  const taggedText = new TaggedTextPlus(text, {
    default: {
      fontSize: '24px',
      fill: '#fff',
      align: 'left',
    },
  });
  taggedText.x = x;
  taggedText.y = y;
  masterContainer.addChild(taggedText);
};
export { drawBasicText };
