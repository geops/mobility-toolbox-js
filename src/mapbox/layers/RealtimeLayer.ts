import { fromLonLat } from 'ol/proj';
import { unByKey } from 'ol/Observable';
import { getWidth, getHeight } from 'ol/extent';
import transformRotate from '@turf/transform-rotate';
import { point } from '@turf/helpers';
import { Coordinate } from 'ol/coordinate';
import { Feature } from 'ol';
import mixin from '../../common/mixins/RealtimeLayerMixin';
import Layer from './Layer';
import { getSourceCoordinates, getMercatorResolution } from '../utils';
import {
  AnyMapboxMap,
  LayerGetFeatureInfoOptions,
  LayerGetFeatureInfoResponse,
} from '../../types';
import { RealtimeTrajectory } from '../../api/typedefs';

/**
 * Responsible for loading and display data from a Realtime service.
 *
 * @example
 * import { RealtimeLayer } from 'mobility-toolbox-js/mapbox';
 *
 * const layer = new RealtimeLayer({
 *   url: [yourUrl],
 *   apiKey: [yourApiKey],
 * });
 *
 *
 * @see <a href="/api/class/src/api/RealtimeAPI%20js~RealtimeAPI%20html">RealtimeAPI</a>
 *
 * @extends {Layer}
 * @implements {RealtimeLayerInterface}
 */
// @ts-ignore
class RealtimeLayer extends mixin(Layer) {
  constructor(options = {}) {
    super({
      ...options,
    });

    /** @ignore */
    this.onLoad = this.onLoad.bind(this);

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
  // @ts-ignore
  attachToMap(map: AnyMapboxMap, beforeId: string) {
    if (!map) {
      return;
    }
    super.attachToMap(map);

    this.source = {
      type: 'canvas',
      canvas: this.canvas,
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

    if (map.isStyleLoaded()) {
      this.onLoad();
    }

    this.map.on('load', this.onLoad);

    this.listeners = [this.on('change:visible', this.onVisibilityChange)];
  }

  /**
   * Remove listeners from the Mapbox Map.
   */
  detachFromMap() {
    if (this.map) {
      this.map.off('load', this.onLoad);

      // @ts-ignore
      this.listeners.forEach((listener) => {
        unByKey(listener);
      });
      if (this.map.style && this.map.getLayer(this.key)) {
        this.map.removeLayer(this.key);
      }
      if (this.map.style && this.map.getSource(this.key)) {
        this.map.removeSource(this.key);
      }
    }
    super.detachFromMap();
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

  onLoad() {
    if (!this.map.getSource(this.key)) {
      this.map.addSource(this.key, this.source);
    }
    if (!this.map.getLayer(this.key)) {
      this.map.addLayer(this.layer, this.beforeId);
    }
  }

  /**
   * Function triggered when the user moves the cursor over the map.
   * @override
   */
  onUserMoveCallback(
    evt: mapboxgl.MapLayerMouseEvent | maplibregl.MapMouseEvent,
  ) {
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
  // @ts-ignore
  renderTrajectories(noInterpolate?: boolean = false) {
    if (!this.map) {
      return;
    }
    if (!this.pixelRatio) {
      this.pixelRatio = 1;
    }

    const { width, height } = this.map.getCanvas();
    const center = this.map.getCenter();

    // We use turf here to have good transform.
    const leftBottom = this.map.unproject({
      x: 0,
      y: height / this.pixelRatio,
    }); // southWest
    const rightTop = this.map.unproject({
      x: width / this.pixelRatio,
      y: 0,
    }); // north east

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

  getFeatureInfoAtCoordinate(
    coordinate: Coordinate,
    options = {},
  ): Promise<LayerGetFeatureInfoResponse> {
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
   * Remove the trajectory form the list if necessary.
   *
   * @private
   */
  purgeTrajectory(
    trajectory: RealtimeTrajectory,
    extent: [number, number, number, number],
    zoom: number,
  ) {
    return super.purgeTrajectory(
      trajectory,
      extent || this.getMercatorExtent(),
      zoom || Math.floor(this.map.getZoom() + 1),
    );
  }

  /**
   * Send the current bbox to the websocket
   */
  setBbox(extent?: [number, number, number, number], zoom?: number) {
    let newExtent = extent;
    let newZoom = zoom;
    if (!newExtent && this.isUpdateBboxOnMoveEnd) {
      newExtent = extent || this.getMercatorExtent();
      newZoom = Math.floor(this.getOlZoom());
    }
    super.setBbox(newExtent, newZoom);
  }

  /**
   * Callback on 'move' event.
   *
   * @private
   */
  onMove() {
    this.renderTrajectories();
  }

  renderTrajectoriesInternal(
    viewState: ViewState,
    noInterpolate: boolean = false,
  ) {
    const render = super.renderTrajectoriesInternal(viewState, noInterpolate);
    if (render && this.map.style) {
      const extent = getSourceCoordinates(this.map, this.pixelRatio);
      const source = this.map.getSource(this.key);
      if (source) {
        source.setCoordinates(extent);
      }
    }
    return render;
  }

  /**
   * Send the new BBOX to the websocket.
   *
   * @private
   * @override
   */
  onMoveEnd() {
    this.renderTrajectories();

    if (this.visible && this.isUpdateBboxOnMoveEnd) {
      this.setBbox();
    }
  }

  /**
   * Update the cursor style when hovering a vehicle.
   *
   * @private
   * @override
   */
  onFeatureHover(
    features: Feature[],
    layer: RealtimeLayer,
    coordinate: Coordinate,
  ) {
    super.onFeatureHover(features, layer, coordinate);
    this.map.getCanvasContainer().style.cursor = features.length
      ? 'pointer'
      : 'auto';
  }
}

export default RealtimeLayer;
