import TrackerLayer from './TrackerLayer';
import mixin from '../../common/mixins/TralisLayerMixin';
import { toLonLat } from 'ol/proj';
import {bgColors, types, getTypeIndex} from '../../common/trackerConfig';

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
   * Remove the trajectory form the list if necessary.
   *
   * @private
   */
  purgeTrajectory(trajectory, extent, zoom) {
    return super.purgeTrajectory(
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

    // if (
    //   this.visible &&
    //   this.isUpdateBboxOnMoveEnd &&
    //   this.isClickActive &&
    //   this.selectedVehicleId
    // ) {
    //   this.highlightTrajectory(this.selectedVehicleId);
    // }
  }

  /**
   * Callback when user clicks on the map.
   * It sets the layer's selectedVehicleId property with the current selected vehicle's id.
   *
   * @private
   * @override
   */
   onFeatureClick(features, layer, coordinate) {
      if (this.map.getLayer(this.key).visibility == 'visible') {
          super.onFeatureClick(features, layer, coordinate);
          this.highlightTrajectory(this.selectedVehicleId);
      }
  }

  /**
   * Highlight the trajectory of journey.
   * @private
   */
  highlightTrajectory(id) {
    if (!this.selectedVehicleId) {
      this.map.getSource("selectedLineTraject").setData({"type": "FeatureCollection", "features": []})
    }
    else {
      this.api
        .getFullTrajectory(id, this.mode, this.generalizationLevel)
        .then((fullTrajectory) => {
           const type = fullTrajectory.features[0].properties.type
           fullTrajectory.features[0].properties.typeIdx = getTypeIndex(type)

          let lineColor = fullTrajectory.features[0].properties.stroke
          if (lineColor && lineColor[0] !== '#') {
            lineColor = `#${lineColor}`
            fullTrajectory.features[0].properties.stroke = lineColor;
          }
          else if(!lineColor){
              lineColor = bgColors[types.findIndex((t) => t.test(type))]
          }

          fullTrajectory.features[0].geometry.geometries.forEach(element => {
            const newCoords = []
            for (const coord of element.coordinates) {
              newCoords.push(toLonLat(coord))
            }
            element.coordinates = newCoords
          });

          const linePaintInterpolation = [
              'interpolate',
              ['linear'],
              ['line-progress'],
              0,
              '#BEBEBE',
              1,
              lineColor
          ]
          this.map.getSource("selectedLineTraject").setData(fullTrajectory)
          this.map.setPaintProperty('trajectoryLine', 'line-gradient', linePaintInterpolation)

        })
    }
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
