/* eslint-disable no-underscore-dangle */
import { Map } from 'mapbox-gl';
import Layer from './Layer';
import mixin from '../../common/mixins/MapboxLayerMixin';
import { getMapboxMapCopyrights, getMapboxRender } from '../../common/utils';

/**
 * A class representing Mapboxlayer to display on BasicMap
 *
 * @example
 * import { MapboxLayer } from 'mobility-toolbox-js/ol';
 *
 * const layer = new MapboxLayer({
 *   url: 'https://maps.geops.io/styles/travic_v2/style.json',
 *   apikey: 'yourApiKey',
 * });
 *
 * @classproperty {ol/Map~Map} map - The map where the layer is displayed.
 * @extends {Layer}
 */
export default class MapboxLayer extends mixin(Layer) {
  /**
   * Initialize the layer and listen to feature clicks.
   * @param {ol/Map~Map} map
   */
  attachToMap(map) {
    super.attachToMap(map);

    if (!this.map || this.mbMap) {
      return;
    }

    this.olListenersKeys.push(
      this.map.on('change:size', () => {
        try {
          if (this.mbMap) {
            this.mbMap.resize();
          }
        } catch (err) {
          // ignore render errors
          // eslint-disable-next-line no-console
          console.warn(err);
        }
      }),
    );
  }

  /**
   * Create the mapbox map.
   * @private
   */
  loadMbMap() {
    // If the map hasn't been resized, the center could be [NaN,NaN].
    // We set default good value for the mapbox map, to avoid the app crashes.
    let [x, y] = this.map.getView().getCenter();
    if (!x || !y) {
      x = 0;
      y = 0;
    }

    // Options the last render run did happen. If something changes
    // we have to render again
    /** @ignore */
    this.renderState = {
      center: [x, y],
      zoom: null,
      rotation: null,
      visible: null,
      opacity: null,
      size: [0, 0],
    };

    super.loadMbMap();

    this.mbMap.once('load', () => {
      this.mbMap.resize();

      /** @ignore */
      this.copyrights = getMapboxMapCopyrights(this.mbMap) || [];

      this.olLayer.getSource()?.setAttributions(this.copyrights);
    });

    const mapboxCanvas = this.mbMap.getCanvas();
    if (mapboxCanvas) {
      if (this.options.tabIndex) {
        mapboxCanvas.setAttribute('tabindex', this.options.tabIndex);
      } else {
        // With a tabIndex='-1' the mouse events works but the map is not focused when we click on it
        // so we remove completely the tabIndex attribute.
        mapboxCanvas.removeAttribute('tabindex');
      }
    }
  }

  getOlLayerRender() {
    return getMapboxRender(this);
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
    return new MapboxLayer({ ...this.options, ...newOptions });
  }
}
