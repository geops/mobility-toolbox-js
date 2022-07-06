import { unByKey } from 'ol/Observable';
import { transformExtent } from 'ol/proj';
import LayerCommon from '../../common/layers/Layer';
import userInteractionsMixin from '../../common/mixins/UserInteractionsLayerMixin';

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
class Layer extends userInteractionsMixin(LayerCommon) {
  /**
   * Initialize the layer and listen to user events.
   * @param {ol/Map~Map} map
   */
  attachToMap(map) {
    super.attachToMap(map);

    if (!this.map) {
      return;
    }

    if (this.userInteractions) {
      this.toggleVisibleListeners();
      this.onChangeVisibleKey = this.on(
        'change:visible',
        this.toggleVisibleListeners,
      );
    }
  }

  detachFromMap() {
    if (this.map) {
      this.deactivateUserInteractions();
      unByKey(this.onChangeVisibleKey);
    }
    super.detachFromMap();
  }

  activateUserInteractions() {
    this.deactivateUserInteractions();
    if (
      this.map &&
      this.userInteractions &&
      this.userClickInteractions &&
      this.userClickCallbacks.length
    ) {
      this.map.on('click', this.onUserClickCallback);
    }

    if (
      this.map &&
      this.userInteractions &&
      this.userHoverInteractions &&
      this.userHoverCallbacks.length
    ) {
      this.map.on('mousemove', this.onUserMoveCallback);
    }
  }

  deactivateUserInteractions() {
    if (this.map) {
      this.map.off('mousemove', this.onUserMoveCallback);
      this.map.off('click', this.onUserClickCallback);
    }
  }

  /**
   * Toggle listeners needed when a layer is avisible or not.
   * @private
   */
  toggleVisibleListeners() {
    if (this.visible) {
      this.activateUserInteractions();
    } else {
      this.deactivateUserInteractions();
    }
  }

  /**
   * Returns the current extent in mercator coordinates.
   */
  getMercatorExtent() {
    const bounds = this.map.getBounds().toArray();
    return transformExtent(
      [...bounds[0], ...bounds[1]],
      'EPSG:4326',
      'EPSG:3857',
    );
  }

  /**
   * Returns the equivalent zoom in Openlayers.
   */
  getOlZoom() {
    return this.map.getZoom() + 1;
  }

  /**
   * Create a copy of the Layer.
   * @param {Object} newOptions Options to override
   * @return {Layer} A Layer
   */
  clone(newOptions) {
    return new Layer({ ...this.options, ...newOptions });
  }
}
export default Layer;
