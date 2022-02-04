import { fromLonLat } from 'ol/proj';
import { unByKey } from 'ol/Observable';
import { getWidth, getHeight } from 'ol/extent';
import transformRotate from '@turf/transform-rotate';
import { point } from '@turf/helpers';
import Layer from './Layer';
import mixin from '../../common/mixins/TrackerLayerMixin';
import { getSourceCoordinates, getMercatorResolution } from '../utils';
/**
 * Responsible for loading tracker data.
 *
 * @classproperty {mapboxgl.Map} map - The map where the layer is displayed.
 * @extends {Layer}
 * @implements {TrackerLayerInterface}
 */
class TrackerLayer extends mixin(Layer) {
  constructor(options = {}) {
    super({
      ...options,
    });

    /** @ignore */
    this.onMove = this.onMove.bind(this);

    /** @ignore */
    this.onMoveEnd = this.onMoveEnd.bind(this);

    /** @ignore */
    this.onZoomEnd = this.onZoomEnd.bind(this);

    /** @ignore */
    this.onVisibilityChange = this.onVisibilityChange.bind(this);
  }

  /**
   * Initialize the layer.
   *
   * @param {mapboxgl.Map} map A [mapbox Map](https://docs.mapbox.com/mapbox-gl-js/api/map/).
   * @param {string} beforeId Layer's id before which we want to add the new layer.
   * @override
   */
  init(map, beforeId) {
    if (!map) {
      return;
    }

    const canvas = map.getCanvas();

    super.init(map, {
      width: canvas.width / this.pixelRatio,
      height: canvas.height / this.pixelRatio,
    });

    const source = {
      type: 'canvas',
      canvas: this.tracker.canvas,
      coordinates: getSourceCoordinates(map, this.pixelRatio),
      // Set to true if the canvas source is animated. If the canvas is static, animate should be set to false to improve performance.
      animate: true,
      attribution: this.copyrights && this.copyrights.join(', '),
    };

    this.beforeId = beforeId;
    this.layer = {
      id: this.key,
      type: 'raster',
      source: this.key,
      layout: {
        visibility: this.visible ? 'visible' : 'none',
      },
      paint: {
        'raster-opacity': 1,
        'raster-fade-duration': 0,
        'raster-resampling': 'nearest', // important otherwise it looks blurry
      },
    };
    map.addSource(this.key, source);
    map.addLayer(this.layer, this.beforeId);

    this.listeners = [this.on('change:visible', this.onVisibilityChange)];
  }

  /**
   * Remove listeners from the Mapbox Map.
   */
  terminate() {
    if (this.map) {
      this.listeners.forEach((listener) => {
        unByKey(listener);
      });
      if (this.map.getLayer(this.key)) {
        this.map.removeLayer(this.key);
      }
      if (this.map.getSource(this.key)) {
        this.map.removeSource(this.key);
      }
    }
    super.terminate();
  }

  /**
   * Start updating vehicles position.
   *
   * @listens {mapboxgl.map.event:zoomend} Listen to zoom end event.
   * @listens {mapboxgl.map.event:mousemove} Listen to mousemove end.
   * @override
   */
  start() {
    super.start();

    this.map.on('move', this.onMove);
    this.map.on('moveend', this.onMoveEnd);
    this.map.on('zoomend', this.onZoomEnd);
  }

  /**
   * Stop updating vehicles position, and unlisten events.
   *
   * @override
   */
  stop() {
    super.stop();
    if (this.map) {
      this.map.off('move', this.onMove);
      this.map.off('moveend', this.onMoveEnd);
      this.map.off('zoomend', this.onZoomEnd);
    }
  }

  /**
   * Function triggered when the user click the map.
   * @override
   */
  onUserClickCallback(evt) {
    super.onUserClickCallback({
      coordinate: fromLonLat(evt.lngLat.toArray()),
      ...evt,
    });
  }

  /**
   * Function triggered when the user moves the cursor over the map.
   * @override
   */
  onUserMoveCallback(evt) {
    super.onUserMoveCallback({
      coordinate: fromLonLat(evt.lngLat.toArray()),
      ...evt,
    });
  }

  /**
   * Render the trajectories using current map's size, resolution and rotation.
   * @param {boolean} noInterpolate if true, renders the vehicles without interpolating theirs positions.
   * @overrides
   */
  renderTrajectories(noInterpolate) {
    const { width, height } = this.map.getCanvas();
    const center = this.map.getCenter();

    // We use turf here to have good transform.
    const leftBottom = this.map.unproject({
      x: 0,
      y: height / this.pixelRatio,
    }); // southWest
    const rightTop = this.map.unproject({ x: width / this.pixelRatio, y: 0 }); // north east

    const coord0 = transformRotate(
      point([leftBottom.lng, leftBottom.lat]),
      -this.map.getBearing(),
      {
        pivot: [center.lng, center.lat],
      },
    ).geometry.coordinates;
    const coord1 = transformRotate(
      point([rightTop.lng, rightTop.lat]),
      -this.map.getBearing(),
      {
        pivot: [center.lng, center.lat],
      },
    ).geometry.coordinates;

    const bounds = [...fromLonLat(coord0), ...fromLonLat(coord1)];
    const xResolution = getWidth(bounds) / (width / this.pixelRatio);
    const yResolution = getHeight(bounds) / (height / this.pixelRatio);
    const res = Math.max(xResolution, yResolution);

    // Coordinate of trajectories are in mercator so we have to pass the proper resolution and center in mercator.
    const viewState = {
      size: [width / this.pixelRatio, height / this.pixelRatio],
      center: fromLonLat([center.lng, center.lat]),
      extent: bounds,
      resolution: res,
      zoom: this.map.getZoom(),
      rotation: -(this.map.getBearing() * Math.PI) / 180,
      pixelRatio: this.pixelRatio,
    };

    super.renderTrajectories(viewState, noInterpolate);
  }

  /**
   * Return the delay in ms before the next rendering.
   */
  getRefreshTimeInMs() {
    return super.getRefreshTimeInMs(this.map.getZoom());
  }

  /**
   * Returns an array of vehicles located at the given coordinate.
   *
   * @param {Array<number>} coordinate
   * @param {number} nb Number of vehicles to return;
   * @return {Array<ol/Feature~Feature>} Array of vehicle.
   * @override
   */
  getVehiclesAtCoordinate(coordinate, nb) {
    const resolution = getMercatorResolution(this.map);
    return super.getVehiclesAtCoordinate(coordinate, resolution, nb);
  }

  getFeatureInfoAtCoordinate(coordinate, options = {}) {
    const resolution = getMercatorResolution(this.map);
    return super.getFeatureInfoAtCoordinate(coordinate, {
      resolution,
      ...options,
    });
  }

  onVisibilityChange() {
    if (this.visible && !this.map.getLayer(this.key)) {
      this.map.addLayer(this.layer, this.beforeId);
    } else if (this.map.getLayer(this.key)) {
      this.map.removeLayer(this.key);
    }
    // We can't use setLayoutProperty it triggers an error probably a bug in mapbox
    // this.map.setLayoutProperty(
    //   this.key,
    //   'visibilty',
    //   this.visible ? 'visible' : 'none',
    // );
  }

  /**
   * Callback on 'move' event.
   *
   * @private
   */
  onMove() {
    const extent = getSourceCoordinates(this.map, this.pixelRatio);
    const source = this.map.getSource(this.key);
    if (source) {
      source.setCoordinates(extent);
    }
    this.renderTrajectories();
  }

  /**
   * Callback on 'moveend' event.
   *
   * @private
   */
  // eslint-disable-next-line class-methods-use-this
  onMoveEnd() {}

  /**
   * Update the cursor style when hovering a vehicle.
   *
   * @private
   * @override
   */
  onFeatureHover(features, layer, coordinate) {
    super.onFeatureHover(features, layer, coordinate);
    this.map.getCanvasContainer().style.cursor = features.length
      ? 'pointer'
      : 'auto';
  }
}

export default TrackerLayer;
