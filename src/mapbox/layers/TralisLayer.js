import TrackerLayer from './TrackerLayer';
import { getSourceCoordinates, getResolution } from '../utils';
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
    this.onMove = this.onMove.bind(this);
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
    super.init(map);

    if (!this.map) {
      return;
    }

    this.map.on('zoomend', this.onZoomEnd);
    this.map.on('move', this.onMove);
    this.map.on('moveend', this.onMoveEnd);

    const { width, height } = this.map.getCanvas();
    this.tracker.canvas.width = width;
    this.tracker.canvas.height = height;

    this.map.addSource('canvas-source', {
      type: 'canvas',
      canvas: this.tracker.canvas,
      coordinates: getSourceCoordinates(this.map),
      // Set to true if the canvas source is animated. If the canvas is static, animate should be set to false to improve performance.
      animate: true,
    });
    this.map.addLayer(
      {
        id: 'canvas-layer',
        type: 'raster',
        source: 'canvas-source',
        paint: {
          'raster-opacity': 1,
          'raster-fade-duration': 0,
        },
      },
      beforeId,
    );
  }

  /**
   * Remove listeners from the Mapbox Map.
   */
  terminate() {
    if (this.map) {
      this.map.off('zoomend', this.onZoomEnd);
      this.map.off('move', this.onMove);
      this.map.off('moveend', this.onMoveEnd);
    }
    super.terminate();
  }

  /**
   * Callback on 'move' event.
   *
   * @private
   */
  onMove() {
    this.map
      .getSource('canvas-source')
      .setCoordinates(getSourceCoordinates(this.map));
    const { width, height } = this.map.getCanvas();
    this.renderTrajectories(
      this.currTime,
      [width, height],
      getResolution(this.map),
    );
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
