import { Style, Fill, Stroke, Circle } from 'ol/style';
import { getBgColor } from '../../common/trackerConfig';

const borderStyle = new Style({
  zIndex: 2,
  image: new Circle({
    radius: 5,
    fill: new Fill({
      color: '#000000',
    }),
  }),
  stroke: new Stroke({
    color: '#000000',
    width: 6,
  }),
});

const fullTrajectorystyle = (feature) => {
  let lineColor = '#ffffff'; // white

  const type = feature.get('type');
  let stroke = feature.get('stroke');

  if (stroke && stroke[0] !== '#') {
    stroke = `#${stroke}`;
  }

  lineColor = stroke || getBgColor(type);

  // Don't allow white lines, use red instead.
  lineColor = /#ffffff/i.test(lineColor) ? '#ff0000' : lineColor;

  const style = [
    borderStyle,
    new Style({
      zIndex: 3,
      image: new Circle({
        radius: 4,
        fill: new Fill({
          color: lineColor,
        }),
      }),
      stroke: new Stroke({
        color: lineColor,
        width: 4,
      }),
    }),
  ];
  return style;
};
export default fullTrajectorystyle;
