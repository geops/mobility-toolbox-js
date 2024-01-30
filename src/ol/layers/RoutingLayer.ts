import { Circle, Fill, Stroke, Style } from 'ol/style';
import { Vector as VectorSource } from 'ol/source';
import { Vector } from 'ol/layer';
import type { StyleFunction, StyleLike } from 'ol/style/Style';
import type { FeatureLike } from 'ol/Feature';
import { Geometry } from 'ol/geom';
import Feature from 'ol/Feature';
import VectorLayer from 'ol/layer/Vector';
import Layer from './Layer';
import type { LayerOptions } from './Layer';

export type OlRoutingLayerOptions = LayerOptions & {
  olLayer?: Vector<VectorSource<Feature<Geometry>>>;
  style?: StyleLike;
};

/** @private */
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

/** @private */
const blackBorder = new Style({
  stroke: new Stroke({
    color: [0, 0, 0, 1],
    width: 5,
  }),
});

/** @private */
const redLine = new Style({
  image: circleStyle,
  stroke: new Stroke({
    color: [255, 0, 0, 1],
    width: 3,
  }),
});

/** @private */
const dashedRedLine = new Style({
  image: circleStyle,
  stroke: new Stroke({
    color: [255, 0, 0, 1],
    width: 3,
    lineDash: [1, 10],
  }),
});

/** @private */
const defaultStyleFunction: StyleFunction = (
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

/**
 * A class use to display vector data.
 *
 * @classproperty {ol/Map~Map} map - The map where the layer is displayed.
 * @extends {Layer}
 * @private
 * @deprecated
 */
class RoutingLayer extends Layer {
  // @ts-ignore
  olLayer?: VectorLayer;

  options: OlRoutingLayerOptions = {};

  /**
   * Constructor.
   * @param {Object} [options]
   * @param {ol/style/Style~StyleLike} [options.style] Style to be used for routes, uses (ol/StyleLike) [https://openlayers.org/en/latest/apidoc/module-ol_style_Style.html#~StyleLike] instances
   */
  constructor(options: OlRoutingLayerOptions) {
    super(options);

    this.olLayer =
      options.olLayer ||
      new Vector({
        source: new VectorSource(),
        style: options.style || defaultStyleFunction,
      });

    // eslint-disable-next-line no-console
    console.warn(
      `Deprecated. Replace this RoutingLayer by an ol layer with vector source.`,
    );
  }

  /**
   * Create a copy of the RoutingLayer.
   * @param {Object} newOptions Options to override
   * @return {RoutingLayer} A RoutingLayer
   */
  // @ts-ignore
  clone(newOptions: OlRoutingLayerOptions) {
    return new RoutingLayer({ ...this.options, ...newOptions });
  }
}

export default RoutingLayer;
