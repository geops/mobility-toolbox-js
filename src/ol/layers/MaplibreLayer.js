import { Map } from 'maplibre-gl';
import Layer from './Layer';
import mixin from '../../common/mixins/MapboxLayerMixin';
import { getMaplibreRender } from '../../common/utils';

/**
 * A class representing MaplibreLayer to display on BasicMap
 *
 * @example
 * import { MaplibreLayer } from 'mobility-toolbox-js/ol';
 *
 * const layer = new MaplibreLayer({
 *   url: 'https://maps.geops.io/styles/travic_v2/style.json',
 *   apikey: 'yourApiKey',
 * });
 *
 * @classproperty {ol/Map~Map} map - The map where the layer is displayed.
 * @extends {Layer}
 */
export default class MaplibreLayer extends mixin(Layer) {
  getOlLayerRender() {
    return getMaplibreRender(this);
  }

  // eslint-disable-next-line class-methods-use-this
  getMapboxMapClass() {
    return Map;
  }

  /**
   * Create a copy of the MapboxLayer.
   * @param {Object} newOptions Options to override
   * @return {MapboxLayer} A MapboxLayer
   */
  clone(newOptions) {
    return new MaplibreLayer({ ...this.options, ...newOptions });
  }
}
