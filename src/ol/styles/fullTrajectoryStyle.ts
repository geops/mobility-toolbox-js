import { Circle, Fill, Stroke, Style } from 'ol/style';

import { getColorForType } from '../../common/utils/realtimeStyleUtils';

import type Feature from 'ol/Feature';

import type {
  RealtimeFullTrajectoryProperties,
  RealtimeLayer,
} from '../../types';

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

const fullTrajectorystyle = (feature: Feature): Style[] => {
  const { stroke, type } =
    feature.getProperties() as RealtimeFullTrajectoryProperties;

  let lineColor = stroke || getColorForType(type) || '#000';

  if (lineColor && !lineColor.startsWith('#')) {
    lineColor = `#${lineColor}`;
  }

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
