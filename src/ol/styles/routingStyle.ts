import { FeatureLike } from 'ol/Feature';
import { Circle, Fill, Stroke } from 'ol/style';
import Style, { StyleFunction } from 'ol/style/Style';

const circleStyle = new Circle({
  fill: new Fill({
    color: [255, 0, 0, 1],
  }),
  radius: 6,
  stroke: new Stroke({
    color: [0, 0, 0, 1],
    width: 1,
  }),
});

const blackBorder = new Style({
  stroke: new Stroke({
    color: [0, 0, 0, 1],
    width: 5,
  }),
});

const redLine = new Style({
  image: circleStyle,
  stroke: new Stroke({
    color: [255, 0, 0, 1],
    width: 3,
  }),
});

const dashedRedLine = new Style({
  image: circleStyle,
  stroke: new Stroke({
    color: [255, 0, 0, 1],
    lineDash: [1, 10],
    width: 3,
  }),
});

const routingStyle: StyleFunction = (
  feature: FeatureLike,
  resolution: number,
) => {
  const minResolution = feature.get('minResolution');
  const maxResolution = feature.get('maxResolution');
  const inRange = resolution <= minResolution && resolution > maxResolution;

  if (minResolution && maxResolution && !inRange) {
    return [];
  }
  const mot = feature.get('mot');

  if (mot !== 'foot') {
    return [blackBorder, redLine];
  }

  return [dashedRedLine];
};

export default routingStyle;
