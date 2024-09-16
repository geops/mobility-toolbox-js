import { Circle, Fill, Stroke, Style } from 'ol/style';

import type { FeatureLike } from 'ol/Feature';

const borderStyle = new Style({
  image: new Circle({
    fill: new Fill({
      color: '#000000',
    }),
    radius: 5,
  }),
  stroke: new Stroke({
    color: '#000000',
    width: 6,
  }),
  zIndex: 2,
});

const fullTrajectorystyle = (
  feature: FeatureLike,
  resolution: number,
  options: any,
): Style[] => {
  let lineColor = '#ffffff'; // white

  const type = feature.get('type');
  let stroke = feature.get('stroke');

  if (stroke && stroke[0] !== '#') {
    stroke = `#${stroke}`;
  }

  lineColor = stroke || options?.getBgColor(type);

  // Don't allow white lines, use red instead.
  lineColor = /#ffffff/i.test(lineColor) ? '#ff0000' : lineColor;

  const style = [
    borderStyle,
    new Style({
      image: new Circle({
        fill: new Fill({
          color: lineColor,
        }),
        radius: 4,
      }),
      stroke: new Stroke({
        color: lineColor,
        width: 4,
      }),
      zIndex: 3,
    }),
  ];
  return style;
};
export default fullTrajectorystyle;
