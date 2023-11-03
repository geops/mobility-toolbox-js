// @ts-nocheck
// eslint-disable-next-line max-classes-per-file
import { EventsKey } from 'ol/events';
import { CustomLayerInterface } from 'maplibre-gl';
import { unByKey } from 'ol/Observable';
import { transformExtent } from 'ol/proj';
import PropertiesLayerMixin, {
  LayerCommonOptions,
} from '../../common/mixins/PropertiesLayerMixin';
import UserInteractionsMixin from '../../common/mixins/UserInteractionsLayerMixin';
import { AnyMapboxMap, UserInteractionCallback } from '../../types';

class Base implements CustomLayerInterface {
  // eslint-disable-next-line class-methods-use-this
  onAdd() {}

  // eslint-disable-next-line class-methods-use-this
  onRemove() {}

  defineProperties() {}

  attachToMap() {}

  detachFromMap() {}
}

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

class Layer extends UserInteractionsMixin(Base) {
  options!: LayerCommonOptions;

  onChangeVisibleKey?: EventsKey;

  /* userInteractionsMixin */

  userInteractions?: boolean;

  userClickInteractions?: boolean;

  userHoverInteractions?: boolean;

  userClickCallbacks?: UserInteractionCallback[];

  userHoverCallbacks?: UserInteractionCallback[];

  onUserClickCallback!: () => void;

  onUserMoveCallback!: () => void;

  // constructor() {
  //   // this.id = 'null-island';
  //   // this.type = 'custom';
  //   // this.renderingMode = '2d';
  // }

  onAdd(map) {
    console.log('attachToMap');
    this.attachToMap(map);
  }

  onRemove() {
    this.detachFromMap(map);
  }

  /**
   * Initialize the layer and listen to user events.
   * @param {mapboxgl.Map|maplibregl.Map} map
   */
  attachToMap(map: AnyMapboxMap) {
    super.attachToMap(map);

    if (!this.map) {
      return;
    }

    if (this.userInteractions) {
      this.toggleVisibleListeners();
      this.onChangeVisibleKey = this.on(
        // @ts-ignore
        'change:visible',
        this.toggleVisibleListeners,
      );
    }
  }

  detachFromMap() {
    if (this.map) {
      this.deactivateUserInteractions();
      // @ts-ignore
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
      this.userClickCallbacks?.length
    ) {
      this.map.on('click', this.onUserClickCallback);
    }

    if (
      this.map &&
      this.userInteractions &&
      this.userHoverInteractions &&
      this.userHoverCallbacks?.length
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
  clone(newOptions: LayerCommonOptions) {
    return new Layer({ ...this.options, ...newOptions });
  }
}
export default Layer;
