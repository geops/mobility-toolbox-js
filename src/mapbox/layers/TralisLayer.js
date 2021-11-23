import { transformExtent } from 'ol/proj';
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
  /**
   * Send the new BBOX to the websocket.
   *
   * @param {ol/MapEvent~MapEvent} evt Moveend event
   * @private
   * @override
   */
  onMoveEnd(evt) {
    super.onMoveEnd(evt);
    console.log('onMoveEnd');

    if (this.isUpdateBboxOnMoveEnd) {
      const bounds = this.map.getBounds().toArray();
      this.api.conn.setBbox([
        ...transformExtent(
          [...bounds[0], ...bounds[1]],
          'EPSG:4326',
          'EPSG:3857',
        ),
        Math.floor(this.map.getZoom() + 1),
      ]);
    }
  }
}

export default TralisLayer;
