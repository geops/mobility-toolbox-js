/* eslint-disable @typescript-eslint/no-useless-constructor */
// @ts-nocheck
import { Map } from 'ol';
import Base from 'ol/layer/Layer';
import { EventsKey } from 'ol/events';
import LayerGroup from 'ol/layer/Group';
import { unByKey } from 'ol/Observable';
import type { LayerCommonOptions } from '../../common/mixins/PropertiesLayerMixin';
import UserInteractionsMixin from '../../common/mixins/UserInteractionsLayerMixin';
import type { UserInteractionCallback } from '../../types';
import PropertiesLayerMixin from '../../common/mixins/PropertiesLayerMixin';

export type OlLayerOptions = LayerCommonOptions & {
  olLayer?: Base;
};

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
 * @extends {LayerCommon}
 */
class Layer extends UserInteractionsMixin(PropertiesLayerMixin(Base)) {
  olLayer?: Base | LayerGroup;

  olListenersKeys!: EventsKey[];

  /* LayerCommon */

  options!: OlLayerOptions;

  visible!: boolean;

  copyrights!: string[];

  map?: Map;

  singleClickListenerKey!: EventsKey;

  pointerMoveListenerKey!: EventsKey;

  /* userInteractionsMixin */

  userInteractions?: boolean;

  userClickInteractions?: boolean;

  userHoverInteractions?: boolean;

  userClickCallbacks?: UserInteractionCallback[];

  userHoverCallbacks?: UserInteractionCallback[];

  onUserClickCallback!: () => void;

  onUserMoveCallback!: () => void;

  /**
   * Constructor.
   *
   * @param {LayerCommonOptions} options
   * @param {string} [options.name=uuid()] Layer name. Default use a generated uuid.
   * @param {string} [options.key=uuid().toLowerCase()] Layer key, will use options.name.toLowerCase() if not specified.
   * @param {string} [options.copyright=undefined] Copyright-Statement.
   * @param {Array<Layer>} [options.children=[]] Sublayers.
   * @param {Object} [options.properties={}] Application-specific layer properties.
   * @param {boolean} [options.visible=true] If true this layer is the currently visible layer on the map.
   */
  constructor(options: OlLayerOptions) {
    super(options);
  }

  setMapInternal(map: Map) {
    super.setMapInternal(map);
    if (map) {
      this.attachToMap(map);
    } else {
      this.detachFromMap();
    }
  }

  /**
   * Define layer's properties.
   *
   * @private
   */
  defineProperties(options: OlLayerOptions) {
    super.defineProperties(options);
    Object.defineProperties(this, {
      olLayer: {
        get: () => {
          // eslint-disable-next-line no-console
          console.log(
            "Deprecated property: mobility-toolbox-js/ol layers inherits now from ol/layer/Layer class. This getter is only a redirect to the current 'this' object.",
          );
          return this;
        },
        set: () => {
          // eslint-disable-next-line no-console
          console.log(
            'Deprecated property: mobility-toolbox-js/ol layers inherits now from ol/layer/Layer class. This setter has no effect.',
          );
        },
      },
      olListenersKeys: {
        value: [],
      },
    });
  }

  /**
   * Initialize the layer and listen to feature clicks.
   * @param {ol/Map~Map} map
   * @private
   */
  attachToMap(map: Map) {
    super.attachToMap(map);

    if (!this.map) {
      return;
    }

    this.toggleVisibleListeners();
    this.olListenersKeys.push(
      // @ts-ignore
      this.on('change:visible', this.toggleVisibleListeners),
    );
  }

  /**
   * Terminate what was initialized in init function. Remove layer, events...
   */
  detachFromMap() {
    this.deactivateUserInteractions();
    unByKey(this.olListenersKeys);

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
      this.singleClickListenerKey = this.map.on(
        'singleclick',
        this.onUserClickCallback,
      );
      this.olListenersKeys.push(this.singleClickListenerKey);
    }
    if (
      this.map &&
      this.userInteractions &&
      this.userHoverInteractions &&
      this.userHoverCallbacks?.length
    ) {
      this.pointerMoveListenerKey = this.map.on(
        'pointermove',
        this.onUserMoveCallback,
      );
    }
  }

  deactivateUserInteractions() {
    unByKey([this.pointerMoveListenerKey, this.singleClickListenerKey]);
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
   * Create a copy of the Layer.
   * @param {Object} newOptions Options to override
   * @return {Layer} A Layer
   */
  clone(newOptions: OlLayerOptions) {
    return new Layer({ ...this.options, ...newOptions });
  }
}
export default Layer;
