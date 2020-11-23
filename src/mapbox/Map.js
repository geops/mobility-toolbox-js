import { Map as MBMap } from 'mapbox-gl';
import Observable from 'ol/Observable';
import Layer from '../common/layers/Layer';
import CopyrightControl from './controls/Copyright';
import mixin from '../common/mixins/MapMixin';

/**
 * [mapbox-gl-js Map](https://docs.mapbox.com/mapbox-gl-js/api/map) wit some custom functionality for `mobility-toolbox-js.
 *
 * @extends {mapboxgl.Map}
 * @implements {MapInterface}
 */
class Map extends mixin(MBMap) {
  /**
   * Constructor.
   */
  constructor(options) {
    super({
      ...options,
      attributionControl: false,
    });

    /** @ignore */
    this.mobilityLayers = [];

    this.addMobilityControl(new CopyrightControl());
  }

  /**
   * Adds a layer to the map.
   * @param {Layer|mapboxgl.Layer} layer The layer to add.
   * @param {number} beforeId See [mapbox-gl-js doc](https://docs.mapbox.com/mapbox-gl-js/api/map/#map#addlayer)
   */
  addLayer(layer, beforeId) {
    if (layer instanceof Layer) {
      this.mobilityLayers.push(layer);
      this.dispatchEvent('change:mobilityLayer');

      if (this.isStyleLoaded()) {
        layer.init(this, beforeId);
      } else {
        this.on('load', () => {
          layer.init(this, beforeId);
        });
      }
    } else {
      super.addLayer(layer, beforeId);
    }
  }

  /**
   * Returns a list of mobility layers.
   * @returns {Layer[]}
   */
  getMobilityLayers() {
    return this.mobilityLayers;
  }

  /**
   * Removes a given layer from the map.
   * @param {Layer|number} layer The layer to remove.
   *    If it's a mapbox-layer, pass the id instead..
   */
  removeLayer(layer) {
    if (layer instanceof Layer) {
      layer.terminate();
      this.mobilityLayers = this.mobilityLayers.filter((l) => l !== layer);
    } else {
      super.removeLayer(layer);
    }
  }
}

Object.assign(Map.prototype, Observable);

export default Map;
