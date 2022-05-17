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
  setBbox(extent, zoom) {
    let newExtent = extent;
    let newZoom = zoom;
    if (!newExtent && this.isUpdateBboxOnMoveEnd) {
      newExtent = extent || this.getMercatorExtent();
      newZoom = Math.floor(this.getOlZoom());
    }
    super.setBbox(newExtent, newZoom);
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

    if (
      this.visible &&
      this.isUpdateBboxOnMoveEnd &&
      this.isClickActive &&
      this.selectedVehicleId
    ) {
      this.highlightTrajectory(this.selectedVehicleId);
    }
  }

  /**
   * Callback when user clicks on the map.
   * It sets the layer's selectedVehicleId property with the current selected vehicle's id.
   *
   * @private
   * @override
   */
   onFeatureClick(features, layer, coordinate) {
    super.onFeatureClick(features, layer, coordinate);
    if (this.selectedVehicleId) {
      this.highlightTrajectory(this.selectedVehicleId);
    }
  }

  /**
   * Highlight the trajectory of journey.
   * @private
   */
  highlightTrajectory(id) {
    this.api
      .getFullTrajectory(id, this.mode, this.generalizationLevel)
      .then((fullTrajectory) => {
        const vectorSource = this.vectorLayer.getSource();
        vectorSource.clear();

        if (
          !fullTrajectory ||
          !fullTrajectory.features ||
          !fullTrajectory.features.length
        ) {
          return;
        }

        let lineColor = '#ffffff'; // white

        if (this.useDelayStyle) {
          lineColor = '#a0a0a0'; // grey
        } else {
          const props = fullTrajectory.features[0].properties;
          const { type } = props;
          let { stroke } = props;

          if (stroke && stroke[0] !== '#') {
            stroke = `#${stroke}`;
          }

          lineColor = stroke || getBgColor(type);

          // Don't allow white lines, use red instead.
          lineColor = /#ffffff/i.test(lineColor) ? '#ff0000' : lineColor;
        }
        const style = [
          new Style({
            zIndex: 2,
            image: new Circle({
              radius: 5,
              fill: new Fill({
                color: '#000000',
              }),
            }),
            stroke: new Stroke({
              color: '#000000',
              width: 6,
            }),
          }),
          new Style({
            zIndex: 3,
            image: new Circle({
              radius: 4,
              fill: new Fill({
                color: lineColor,
              }),
            }),
            stroke: new Stroke({
              color: lineColor,
              width: 4,
            }),
          }),
        ];
        this.vectorLayer.setStyle(style);
        const features = format.readFeatures(fullTrajectory);
        features.forEach((feature) => {
          feature.setStyle(style);
        });
        this.vectorLayer.getSource().addFeatures(features);
      });
  }

  /**
   * Create a copy of the TralisLayer.
   * @param {Object} newOptions Options to override
   * @return {TralisLayer} A TralisLayer
   */
  clone(newOptions) {
    return new TralisLayer({ ...this.options, ...newOptions });
  }
}

export default TralisLayer;
