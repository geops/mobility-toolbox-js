import { Circle, Fill, Stroke, Style } from 'ol/style';
import { Vector as VectorSource } from 'ol/source';
import { Vector } from 'ol/layer';
import Layer from './Layer';

const defaultStyleFunction = (feature, resolution) => {
  const mot = feature.get('mot');
  const viaPointIdx = feature.get('viaPointIdx');
  const minResolution = feature.get('minResolution');
  const maxResolution = feature.get('maxResolution');
  const inRange = resolution <= minResolution && resolution > maxResolution;

  // Default style for via points
  const image =
    viaPointIdx !== undefined &&
    new Circle({
      radius: 6,
      fill: new Fill({
        color: [255, 0, 0, 1],
      }),
      stroke: new Stroke({
        color: [0, 0, 0, 1],
        width: 1,
      }),
    });

  if (inRange === false) {
    return [new Style({ image })];
  }

  // Default style for route lines
  const stroke =
    mot &&
    new Stroke({
      color: [255, 0, 0, 1],
      width: 3,
      lineDash: mot === 'foot' ? [1, 10] : undefined,
    });

  const style = new Style({
    stroke,
    image,
  });

  const blackBorder = new Style({
    stroke: new Stroke({
      color: [0, 0, 0, mot === 'foot' ? 0 : 1],
      width: 5,
    }),
  });
  return [blackBorder, style];
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
   * @param {number} [options.style] Style to be used for routes, uses (ol/StyleLike) [https://openlayers.org/en/latest/apidoc/module-ol_style_Style.html#~StyleLike] instances
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
