import TrackerLayer from './TrackerLayer';
import mixin from '../../common/mixins/TralisLayerMixin';

/**
 * Responsible for loading and display data from a Tralis service.
 *
 * @example
 * import { TralisLayer } from 'mobility-toolbox-js/mapbox';
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
    this.onMoveEnd = this.onMoveEnd.bind(this);
  }

  /**
   * Add listeners from the Mapbox Map.
   *
   * @param {mapboxgl.Map} map
   * @param {string} beforeId See [mapboxgl.Map#addLayer](https://docs.mapbox.com/mapbox-gl-js/api/map/#map#addlayer) beforeId documentation.
   */
  init(map, beforeId) {
    super.init(map, beforeId);

    if (!this.map) {
      return;
    }
    this.map.on('moveend', this.onMoveEnd);
  }

  /**
   * Remove listeners from the Mapbox Map.
   */
  terminate() {
    if (this.map) {
      this.map.off('moveend', this.onMoveEnd);
    }
    super.terminate();
  }

  /**
   * Callback on 'moveend' event.
   *
   * @private
   */
  onMoveEnd() {
    this.updateTrajectories();
  }
}

export default TralisLayer;
