import { Circle, Fill, Stroke, Style } from 'ol/style';

import type Feature from 'ol/Feature';

import type { RealtimeStyleOptions } from '../../types';

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
  feature: Feature,
  resolution: number,
  options?: RealtimeStyleOptions,
): Style[] => {
  let lineColor = '#ffffff'; // white

  const type = feature.get('type');
  let stroke = feature.get('stroke');

  if (stroke && stroke[0] !== '#') {
    stroke = `#${stroke}`;
  }

  console.log(feature);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  lineColor =
    stroke ||
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    options?.getColor?.({ properties: feature.getProperties() }, undefined);

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
