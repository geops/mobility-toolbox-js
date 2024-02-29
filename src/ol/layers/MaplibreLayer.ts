import { Map, MapOptions } from 'maplibre-gl';
import MapGlLayer, { MapGlLayerOptions } from './MapGlLayer';
import MaplibreLayerRenderer from '../renderers/MaplibreLayerRenderer';

export type MaplibreLayerOptions = MapGlLayerOptions & {
  mapOptions?: MapOptions;
};

/**
 * This layer is meant to facilitate the use of the geOps Maps api in an OpenLayers map using Maplibre.
 *
 * @example
 * import { MaplibreLayer } from 'mobility-toolbox-js/ol';
 *
 * const layer = new MaplibreLayer({
 *   apiKey: 'yourApiKey',
 *   // apiKeyName: 'key',
 *   // mapOptions: {
 *   //   interactive: false,
 *   //   trackResize: false,
 *   //   attributionControl: false,
 *   // }
 *   // queryRenderedFeaturesOptions: {
 *   //   layers: ['waters_lakes'], // map.getFeaturesAtPixel will only return lakes.
 *   // },
 *   // style: 'travic_v2',
 *   // url: 'https://maps.geops.io',
 * });
 *
 * @classproperty {maplibregl.Map} maplibreMap - The Maplibre map object. Readonly.
 * @classproperty {maplibregl.QueryRenderedFeaturesOptions} queryRenderedFeaturesOptions - Options used when we query features using map.getFeaturesAtPixel().
 * @classproperty {string} style - geOps Maps api style.
 * @extends {ol/layer/Layer~Layer}
 * @public
 */
export default class MaplibreLayer extends MapGlLayer {
  options?: MaplibreLayerOptions;

  /** @private */
  get maplibreMap(): maplibregl.Map | undefined {
    return this.mbMap as maplibregl.Map;
  }

  /**
   * Constructor.
   *
   * @param {MaplibreLayerOptions} options
   * @param {string} options.apiKey Access key for [geOps apis](https://developer.geops.io/).
   * @param {string} [options.apiKeyName="key"] The geOps Maps api key name.
   * @param {maplibregl.MapOptions} [options.mapOptions={ interactive: false, trackResize: false, attributionControl: false }] Maplibre map options.
   * @param {string} [options.style="travic_v2"] The geOps Maps api style.
   * @param {string} [options.url="https://maps.geops.io"] The geOps Maps api url.
   */
  constructor(options: MaplibreLayerOptions) {
    super({ ...options });
  }

  /**
   * @private
   */
  createRenderer() {
    return new MaplibreLayerRenderer(this);
  }

  /**
   * @private
   */
  // eslint-disable-next-line class-methods-use-this
  createMap(options: MapOptions): Map {
    return new Map(options);
  }

  /**
   * Create a copy of the MaplibreLayer.
   * @param {MaplibreLayerOptions} newOptions Options to override
   * @return {MaplibreLayer} A MaplibreLayer layer
   */
  clone(newOptions: MaplibreLayerOptions): MaplibreLayer {
    return new MaplibreLayer({
      ...(this.options || {}),
      ...(newOptions || {}),
    });
  }
}
