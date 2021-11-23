import GeoJSON from 'ol/format/GeoJSON';
import TrackerLayer from './TrackerLayer';
import mixin from '../../common/mixins/TralisLayerMixin';

const format = new GeoJSON();

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
  /**
   * Send the new BBOX to the websocket.
   *
   * @param {ol/MapEvent~MapEvent} evt Moveend event
   * @private
   * @override
   */
  onMoveEnd(evt) {
    super.onMoveEnd(evt);

    if (this.isUpdateBboxOnMoveEnd) {
      this.api.conn.setBbox([
        ...this.map.getView().calculateExtent(),
        Math.floor(this.map.getView().getZoom()),
      ]);
    }
    console.log(this.selectedVehicleId);
    if (this.selectedVehicleId) {
      this.highlightTrajectory();
    }
  }

  /**
   * Highlight the trajectory of journey.
   * @private
   */
  highlightTrajectory() {
    this.api
      .getFullTrajectory(this.selectedVehicleId)
      .then((geojson) => {
        const features = format.readFeatures(geojson);
        this.drawFullTrajectory(features);
        // .then((traj) => {
        //   const { p: multiLine, t, c } = traj;
        //   const lineCoords = [];
        //   multiLine.forEach((line) => {
        //     line.forEach((point) => {
        //       lineCoords.push([point.x, point.y]);
        //     });
        //   });

        //   this.drawFullTrajectory(
        //     this.stationsCoords,
        //     new LineString(lineCoords),
        //     c ? `#${c}` : getBgColor(t),
        //   );
      })
      .catch(() => {
        this.vectorLayer.getSource().clear();
      });
  }

  /**
   * Draw the trajectory as a line with points for each stop.
   * @param {Array} stationsCoords Array of station coordinates.
   * @param {LineString|MultiLineString} lineGeometry A LineString or a MultiLineString.
   * @param {string} color The color of the line.
   * @private
   */
  drawFullTrajectory(features, stationsCoords, lineGeometry, color) {
    // Don't allow white lines, use red instead.
    // const vehiculeColor = /#ffffff/i.test(color) ? '#ff0000' : color;
    const vectorSource = this.vectorLayer.getSource();
    vectorSource.clear();

    // if (stationsCoords) {
    //   const geometry = new MultiPoint(stationsCoords);
    //   const aboveStationsFeature = new Feature(geometry);
    //   aboveStationsFeature.setStyle(
    //     new Style({
    //       zIndex: 1,
    //       image: new Circle({
    //         radius: 5,
    //         fill: new Fill({
    //           color: '#000000',
    //         }),
    //       }),
    //     }),
    //   );
    //   const belowStationsFeature = new Feature(geometry);
    //   belowStationsFeature.setStyle(
    //     new Style({
    //       zIndex: 4,
    //       image: new Circle({
    //         radius: 4,
    //         fill: new Fill({
    //           color: this.useDelayStyle ? '#a0a0a0' : vehiculeColor,
    //         }),
    //       }),
    //     }),
    //   );
    //   vectorSource.addFeatures([aboveStationsFeature, belowStationsFeature]);
    // }

    // const lineFeat = new Feature({
    //   geometry: lineGeometry,
    // });
    // lineFeat.setStyle([
    //   new Style({
    //     zIndex: 2,
    //     stroke: new Stroke({
    //       color: '#000000',
    //       width: 6,
    //     }),
    //   }),
    //   new Style({
    //     zIndex: 3,
    //     stroke: new Stroke({
    //       color: this.useDelayStyle ? '#a0a0a0' : vehiculeColor,
    //       width: 4,
    //     }),
    //   }),
    // ]);
    vectorSource.addFeatures(features);
  }

  /**
   * Create a copy of the TralisLayer.
   * @param {Object} newOptions Options to override
   * @returns {TralisLayer} A TralisLayer
   */
  clone(newOptions) {
    return new TralisLayer({ ...this.options, ...newOptions });
  }
}

export default TralisLayer;
