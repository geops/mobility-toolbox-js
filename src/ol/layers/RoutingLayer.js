import { Circle, Fill, Stroke, Style } from 'ol/style';
import { Vector as VectorSource } from 'ol/source';
import { Vector } from 'ol/layer';
import Layer from './Layer';

const defaultStyleFunction = (feature) => {
  const mot = feature.get('mot');
  const viaPointIdx = feature.get('viaPointIdx');

  // Default style for route lines
  const stroke =
    mot &&
    new Stroke({
      color: [255, 0, 0, 1],
      width: 5,
      lineDash: mot === 'foot' ? [1, 10] : undefined,
    });

  // Default style for via points
  const image =
    viaPointIdx !== undefined &&
    new Circle({
      radius: 6,
      fill: new Fill({
        color: [255, 0, 0, 1],
      }),
    });

  const style = new Style({
    stroke,
    image,
  });
  return style;
};

/**
 * A class use to display vector data.
 *
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
}

export default RoutingLayer;
