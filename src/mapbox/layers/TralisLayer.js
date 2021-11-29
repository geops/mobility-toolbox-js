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
   * Determine if the trajectory must be removed or not added to the list
   *
   * @private
   */
  mustNotBeDisplayed(trajectory, extent, zoom) {
    return super.mustNotBeDisplayed(
      trajectory,
      extent || this.getMercatorExtent(),
      zoom || Math.floor(this.map.getZoom() + 1),
    );
  }

  /**
   * Send the current bbox to the websocket
   */
  setBbox() {
    const extent = this.getMercatorExtent();
    const zoom = Math.floor(this.getOlZoom());

    // Purge trajectories:
    // - which are outside the extent
    // - when it's bus and zoom level is too low for them
    for (let i = this.trajectories.length - 1; i >= 0; i -= 1) {
      const trajectory = this.trajectories[i];
      if (this.mustNotBeDisplayed(trajectory, extent, zoom)) {
        const temp = [...this.trajectories];
        temp.splice(i, 1);
        this.tracker.setTrajectories(temp);
      }
    }

    super.setBbox([...extent, zoom, this.tenant]);
  }

  /**
   * Send the new BBOX to the websocket.
   *
   * @param {ol/MapEvent~MapEvent} evt Moveend event
   * @private
   * @override
   */
  onMoveEnd(evt) {
    super.onMoveEnd(evt);

    if (this.visible && this.isUpdateBboxOnMoveEnd) {
      this.setBbox();
    }
  }
}

export default TralisLayer;
