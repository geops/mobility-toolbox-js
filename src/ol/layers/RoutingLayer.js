import { Circle, Fill, Stroke, Style } from 'ol/style';
import { Vector as VectorSource } from 'ol/source';
import { Vector } from 'ol/layer';
import Layer from './Layer';

const circleStyle = new Circle({
  radius: 6,
  fill: new Fill({
    color: [255, 0, 0, 1],
  }),
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
    width: 3,
    lineDash: [1, 10],
  }),
});

const defaultStyleFunction = (feature, resolution) => {
  const minResolution = feature.get('minResolution');
  const maxResolution = feature.get('maxResolution');
  const inRange = resolution <= minResolution && resolution > maxResolution;

  if (!inRange) {
    return null;
  }
  const mot = feature.get('mot');

  if (mot !== 'foot') {
    return [blackBorder, redLine];
  }

  return [dashedRedLine];
};

/**
 * A class use to display vector data.
 *
 * @classproperty {ol/Map~Map} map - The map where the layer is displayed.
 * @extends {Layer}
 */
class RoutingLayer extends Layer {
  /**
   * Constructor.
   * @param {Object} [options]
   * @param {ol/style/Style~StyleLike} [options.style] Style to be used for routes, uses (ol/StyleLike) [https://openlayers.org/en/latest/apidoc/module-ol_style_Style.html#~StyleLike] instances
   */
  constructor(options = {}) {
    super(options);

    this.olLayer =
      options.olLayer ||
      new Vector({
        source: new VectorSource(),
        style: options.style || defaultStyleFunction,
      });
  }

  /**
   * Create a copy of the RoutingLayer.
   * @param {Object} newOptions Options to override
   * @returns {RoutingLayer} A RoutingLayer
   */
  clone(newOptions) {
    return new RoutingLayer({ ...this.options, ...newOptions });
  }
}

export default RoutingLayer;
