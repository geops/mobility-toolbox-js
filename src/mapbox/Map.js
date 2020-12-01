import { Map as MBMap } from 'mapbox-gl';
import Control from '../common/controls/Control';
import Layer from '../common/layers/Layer';
import mixin from '../common/mixins/MapMixin';
import Copyright from './controls/Copyright';

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

    // Add default CopyrightControl if no custom one provided
    (options.controls || [new Copyright()]).forEach((control) => {
      this.addMobilityControl(control);
    });
  }

  /**
   * Adds a layer to the map.
   * @param {Layer|mapboxgl.Layer} layer The layer to add.
   * @param {number} beforeId See [mapbox-gl-js doc](https://docs.mapbox.com/mapbox-gl-js/api/map/#map#addlayer)
   */
  addLayer(layer, beforeId) {
    if (layer instanceof Layer) {
      this.mobilityLayers.push(layer);
      this.fire('change:mobilityLayers');

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

  /**
   * Adds a given control to the map.
   * @param {Control|mapboxgl.IControl} control The control to add.
   * @param {mapboxgl.position} position Position of the control. Only if control parameter is an <mapboxgl.IControl>.
   */
  addControl(control, position) {
    if (control instanceof Control) {
      this.addMobilityControl(control);
    } else {
      super.addControl(control, position);
    }
  }

  /**
   * Removes a given control to the map.
   * @param {Control|mapboxgl.IControl} control The control to remove.
   */
  removeControl(control) {
    if (control instanceof Control) {
      this.removeMobilityControl(control);
    } else {
      super.removeControl(control);
    }
  }
}

export default Map;
