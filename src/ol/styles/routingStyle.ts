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

  const zIndex = feature?.getGeometry()?.getType() === 'Point' ? 100 : 0;

  let styles = [blackBorder, redLine];
  const mot = feature.get('mot');

  if (mot === 'foot') {
    styles = [dashedRedLine];
  }

  styles = styles.map((style) => {
    const tmp = style.clone();
    tmp.setZIndex(zIndex);
    return tmp;
  });

  return styles;
};

export default routingStyle;
