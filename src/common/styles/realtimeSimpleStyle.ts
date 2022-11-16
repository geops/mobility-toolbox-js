import type { AnyCanvas, RealtimeStyleFunction } from '../../types';
import createCanvas from '../utils/createCanvas';

/**
 * A very simple tracker style.
 * Display blue point for each train.
 */
let canvas: AnyCanvas | null;
const realtimeSimpleStyle: RealtimeStyleFunction = () => {
  if (!canvas) {
    canvas = createCanvas(15, 15);
    const ctx = canvas?.getContext('2d');
    if (ctx) {
      ctx.arc(8, 8, 5, 0, 2 * Math.PI, false);
      ctx.fillStyle = '#8ED6FF';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'black';
      ctx.stroke();
      ctx.lineWidth = 3;
    }
  }
  return canvas;
};
export default realtimeSimpleStyle;
