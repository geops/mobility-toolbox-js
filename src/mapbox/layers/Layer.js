import LayerCommon from '../../common/layers/Layer';

/**
 * A class representing a layer to display on an OpenLayers map.
 *
 * @example
 * import { Layer } from 'mobility-toolbox-js/ol';
 *
 * const layer = new Layer({
 *   olLayer: ...,
 * });
 *
 * @see <a href="/example/ol-map">Map example</a>
 *
 * @classproperty {ol/Map~Map} map - The map where the layer is displayed.
 * @extends {Layer}
 */
class Layer extends LayerCommon {
  /**
   * Initialize the layer and listen to user events.
   * @param {ol/Map~Map} map
   */
  init(map) {
    super.init(map);

    if (!this.map) {
      return;
    }

    if (this.isClickActive) {
      this.map.on('click', this.onUserClickCallback);
    }

    if (this.isHoverActive) {
      this.map.on('mousemove', this.onUserMoveCallback);
    }
  }

  terminate(map) {
    if (this.map) {
      this.map.off('mousemove', this.onUserMoveCallback);
      this.map.off('click', this.onUserClickCallback);
    }
    super.terminate(map);
  }

  /**
   * Function triggered when the user click the map.
   * @private
   */
  onUserClickCallback(evt) {
    super.onUserClickCallback({ coordinate: evt.lngLat.toArray(), ...evt });
  }

  /**
   * Function triggered when the user moves the cursor over the map.
   * @private
   */
  onUserMoveCallback(evt) {
    super.onUserMoveCallback({ coordinate: evt.lngLat.toArray(), ...evt });
  }

  /**
   * Create a copy of the Layer.
   * @param {Object} newOptions Options to override
   * @returns {Layer} A Layer
   */
  clone(newOptions) {
    return new Layer({ ...this.options, ...newOptions });
  }
}
export default Layer;
