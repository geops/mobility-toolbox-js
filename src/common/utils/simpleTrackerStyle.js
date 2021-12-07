/**
 * A very simple tracker style.
 * Display blue point for each train.
 */
const canvas = document.createElement('canvas');
canvas.width = 15;
canvas.height = 15;
const ctx = canvas.getContext('2d');
ctx.arc(8, 8, 5, 0, 2 * Math.PI, false);
ctx.fillStyle = '#8ED6FF';
ctx.fill();
ctx.lineWidth = 3;
ctx.strokeStyle = 'black';
ctx.stroke();
ctx.lineWidth = 3;

const style = () => {
  return canvas;
};
export default style;
