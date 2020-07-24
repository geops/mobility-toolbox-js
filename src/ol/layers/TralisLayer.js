import TrackerLayer from './TrackerLayer';
import mixin from '../../common/mixins/TralisLayerMixin';

/**
 * Responsible for loading and display data from a Tralis service.
 *
 * @example
 * import { TralisLayer } from 'mobility-toolbox-js/ol';
 *
 * const layer = new TralisLayer({
 *   url: [yourUrl],
 *   apiKey: [yourApiKey],
 * });
 *
 *
 * @see <a href="/api/class/src/api/tralis/TralisAPI%20js~TralisAPI%20html">TralisAPI</a>
 *
 * @extends {TrackerLayer}
 * @implements {TralisLayerInterface}
 */
class TralisLayer extends mixin(TrackerLayer) {
  constructor(options = {}) {
    super({ ...options });
    /** @ignore */
    this.resZoom11 = null;
    /** @ignore */
    this.resZoom12 = null;
  }

  /**
   * Initialize the layer:
   *  - add layer to the OpenLayers Map.
   *  - add listeners to the OpenLayers Map.
   *  - subscribe to the Realtime service.
   * @param {ol/Map~Map} map
   */
  init(map) {
    super.init(map);

    if (!this.map) {
      return;
    }

    this.resZoom11 = map.getView().getResolutionForZoom(11); // res zoom 11
    this.resZoom12 = map.getView().getResolutionForZoom(12);
    /** @ignore */
    this.iconScale = this.getIconScaleFromRes(map.getView().getResolution());

    this.olListenersKeys.push(
      map.getView().on('change:resolution', ({ target: view }) => {
        this.iconScale = this.getIconScaleFromRes(view.getResolution());
      }),
    );
  }
}

export default TralisLayer;
