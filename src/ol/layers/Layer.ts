import { Map } from 'ol';
import { EventsKey } from 'ol/events';
import LayerGroup from 'ol/layer/Group';
import OlLayer from 'ol/layer/Layer';
import { unByKey } from 'ol/Observable';
import LayerCommon from '../../common/layers/LayerCommon';
import type { LayerCommonOptions } from '../../common/layers/LayerCommon';
import userInteractionsMixin from '../../common/mixins/UserInteractionsLayerMixin';
import type { UserInteractionCallback } from '../../types';

export type OlLayerOptions = LayerCommonOptions & {
  olLayer?: OlLayer;
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
class Layer extends userInteractionsMixin(LayerCommon) {
  olLayer?: OlLayer | LayerGroup;

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
   * @param {ol/layer/Layer~Layer} options.olLayer The layer (required).
   * @param {string} [options.name=uuid()] Layer name. Default use a generated uuid.
   * @param {string} [options.key=uuid().toLowerCase()] Layer key, will use options.name.toLowerCase() if not specified.
   * @param {string} [options.copyright=undefined] Copyright-Statement.
   * @param {Array<Layer>} [options.children=[]] Sublayers.
   * @param {Object} [options.properties={}] Application-specific layer properties.
   * @param {boolean} [options.visible=true] If true this layer is the currently visible layer on the map.
   */
  constructor(options: OlLayerOptions) {
    super(options);

    if (this.olLayer) {
      this.olLayer.setVisible(this.visible);
    }
  }

  /**
   * Define layer's properties.
   *
   * @ignore
   */
  defineProperties(options: OlLayerOptions) {
    super.defineProperties(options);
    Object.defineProperties(this, {
      olLayer: { value: options.olLayer, writable: true },
      olListenersKeys: {
        value: [],
      },
    });
  }

  /**
   * Initialize the layer and listen to feature clicks.
   * @param {ol/Map~Map} map
   */
  attachToMap(map: Map) {
    super.attachToMap(map);

    if (!this.map) {
      return;
    }

    if (
      this.olLayer &&
      !this.map?.getLayers()?.getArray()?.includes(this.olLayer)
    ) {
      this.map.addLayer(this.olLayer);
    }

    this.olListenersKeys.push(
      // @ts-ignore
      this.on('change:visible', () => {
        if (this.olLayer) {
          this.olLayer.setVisible(this.visible);
        }
      }),
    );

    this.olListenersKeys.push(
      this.map.getLayers().on('remove', (evt) => {
        if (evt.element === this.olLayer) {
          this.detachFromMap();
        }
      }),
    );

    this.toggleVisibleListeners();
    this.olListenersKeys.push(
      // @ts-ignore
      this.on('change:visible', this.toggleVisibleListeners),
    );

    // We set the copyright to the source used by the layer.
    if (this.copyrights && this.olLayer) {
      const attributions = this.copyrights || [];
      if ((this.olLayer as unknown as LayerGroup).getLayers) {
        (this.olLayer as unknown as LayerGroup)
          .getLayers()
          .getArray()
          .forEach((layer) => {
            // @ts-ignore
            if (layer.getSource) {
              // @ts-ignore
              layer.getSource()?.setAttributions(attributions);
            }
          });

        // @ts-ignore
      } else if (this.olLayer.getSource) {
        // @ts-ignore
        this.olLayer.getSource()?.setAttributions(attributions);
      }
    }
  }

  /**
   * Terminate what was initialized in init function. Remove layer, events...
   */
  detachFromMap() {
    this.deactivateUserInteractions();
    unByKey(this.olListenersKeys);

    if (
      this.olLayer &&
      this.map?.getLayers()?.getArray()?.includes(this.olLayer)
    ) {
      this.map.removeLayer(this.olLayer);
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
