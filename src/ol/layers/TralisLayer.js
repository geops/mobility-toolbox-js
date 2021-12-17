import GeoJSON from 'ol/format/GeoJSON';
import Feature from 'ol/Feature';
import { MultiPoint } from 'ol/geom';
import { Style, Fill, Stroke, Circle } from 'ol/style';
import TrackerLayer from './TrackerLayer';
import mixin from '../../common/mixins/TralisLayerMixin';
import { getBgColor } from '../../common';

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
   * Determine if the trajectory must be removed or not added to the list
   *
   * @private
   */
  mustNotBeDisplayed(trajectory, extent, zoom) {
    return super.mustNotBeDisplayed(
      trajectory,
      extent || this.map.getView().calculateExtent(),
      zoom || this.map.getView().getZoom(),
    );
  }

  /**
   * Send the current bbox to the websocket
   *
   * @private
   */
  setBbox() {
    const extent = this.map.getView().calculateExtent();
    const zoom = Math.floor(this.map.getView().getZoom());

    // Purge trajectories:
    // - which are outside the extent
    // - when it's bus and zoom level is too low for them
    // A bit hacky but it works.
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
   * On move end we update the websocket with the new bbox.
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
      let lineColor = '#ffffff'; // white

      if (this.useDelayStyle) {
        lineColor = '#a0a0a0'; // grey
      } else {
        // We get the color of the first feature.
        if (fullTrajectory) {
          const props = fullTrajectory.features[0].properties;
          const { type } = props;
          let { stroke } = props;

          if (stroke && stroke[0] !== '#') {
            stroke = `#${stroke}`;
          }

          lineColor = stroke || getBgColor(type);
        }

        // Don't allow white lines, use red instead.
        lineColor = /#ffffff/i.test(lineColor) ? '#ff0000' : lineColor;
      }

      stopSequence.forEach((sequence) => {
        if (!sequence.stations) {
          return;
        }
        const geometry = new MultiPoint(
          sequence.stations.map((station) => station.coordinate),
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
                color: lineColor,
              }),
            }),
          }),
        );
        vectorSource.addFeatures([aboveStationsFeature, belowStationsFeature]);
      });

      if (fullTrajectory) {
        const style = [
          new Style({
            zIndex: 2,
            stroke: new Stroke({
              color: '#000000',
              width: 6,
            }),
          }),
          new Style({
            zIndex: 3,
            stroke: new Stroke({
              color: lineColor,
              width: 4,
            }),
          }),
        ];
        const features = format.readFeatures(fullTrajectory);
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
