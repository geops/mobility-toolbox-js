import GeoJSON from 'ol/format/GeoJSON';
import Feature from 'ol/Feature';
import { MultiPoint } from 'ol/geom';
import { Style, Fill, Stroke, Circle } from 'ol/style';
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

    if (this.selectedVehicleId) {
      this.highlightTrajectory();
    }
  }

  /**
   * Highlight the trajectory of journey.
   * @private
   */
  highlightTrajectory() {
    super.highlightTrajectory().then(({ stopSequence, fullTrajectory }) => {
      const vectorSource = this.vectorLayer.getSource();
      vectorSource.clear();
      const color =
        (stopSequence &&
          stopSequence[0] &&
          stopSequence[0].color &&
          `#${stopSequence[0].color}`) ||
        '#ff0000';

      // const lineColor = color ? `#${color}` : getBgColor(color);
      // // Don't allow white lines, use red instead.
      // const vehiculeColor = /#ffffff/i.test(lineColor) ? '#ff0000' : lineColor;

      if (
        stopSequence &&
        stopSequence.stations &&
        stopSequence.stations.length &&
        stopSequence.stations[0].coordinate
      ) {
        console.log(stopSequence);
        const geometry = new MultiPoint(
          stopSequence.stations.map((station) => station.coordinates),
        );

        const aboveStationsFeature = new Feature(geometry);
        aboveStationsFeature.setStyle(
          new Style({
            zIndex: 1,
            image: new Circle({
              radius: 5,
              fill: new Fill({
                color: '#000000',
              }),
            }),
          }),
        );
        const belowStationsFeature = new Feature(geometry);
        belowStationsFeature.setStyle(
          new Style({
            zIndex: 4,
            image: new Circle({
              radius: 4,
              fill: new Fill({
                color,
              }),
            }),
          }),
        );
        vectorSource.addFeatures([aboveStationsFeature, belowStationsFeature]);
      }

      if (fullTrajectory) {
        const features = format.readFeatures(fullTrajectory);
        const style = [
          new Style({
            zIndex: 2,
            stroke: new Stroke({
              color,
              width: 6,
            }),
          }),
          new Style({
            zIndex: 3,
            stroke: new Stroke({
              color,
              width: 4,
            }),
          }),
        ];
        features.forEach((feature) => {
          feature.setStyle(style);
        });
        this.vectorLayer.getSource().addFeatures(features);
      }
    });
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
