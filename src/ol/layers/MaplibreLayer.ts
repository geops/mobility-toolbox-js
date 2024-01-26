import { Map, MapOptions } from 'maplibre-gl';
import MapGlLayer, { MapGlLayerOptions } from './MapGlLayer';
import MaplibreLayerRenderer from '../renderers/MaplibreLayerRenderer';

export type MaplibreLayerOptions = MapGlLayerOptions & {
  mapOptions?: MapOptions;
};

/**
 * A class representing MaplibreLayer to display on BasicMap.
 *
 * @example
 * import { MaplibreLayer } from 'mobility-toolbox-js/ol';
 *
 * const layer = new MaplibreLayer({
 *   apikey: 'yourApiKey',
 * });
 *
 * @classproperty {maplibregl.Map} mbMap - The Maplibre map object. Readonly.
 * @classproperty {maplibregl.QueryRenderedFeaturesOptions} queryRenderedFeaturesOptions. Options used when we query features using ol/Map~Map.getFeaturesAtPixel.
 * @classproperty {string} style - geOps Maps api style.
 * @extends {ol/layer/Layer~Layer}
 */
export default class MaplibreLayer extends MapGlLayer {
  readonly mbMap?: maplibregl.Map;

  readonly options: MaplibreLayerOptions;

  /**
   * Constructor.
   *
   * @param {MaplibreLayerOptions} options
   * @param {string} options.apiKey geOps Maps api key.
   * @param {string} [options.apiKeyName="key"] geOps Maps api key name.
   * @param {maplibregl.MapOptions} [options.mapOptions={ interactive: false, trackResize: false, attributionControl: false }] Maplibre map options.
   * @param {string} [options.style="travic_v2"] geOps Maps api style.
   * @param {string} [options.url="https://maps.geops.io"] geOps Maps api url.
   */
  constructor(options: MaplibreLayerOptions = {}) {
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
  clone(newOptions: MaplibreLayerOptions = {}): MaplibreLayer {
    return new MaplibreLayer({
      ...(this.options || {}),
      ...(newOptions || {}),
    });
  }
}
