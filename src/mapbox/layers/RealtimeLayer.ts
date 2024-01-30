// @ts-nocheck
import { fromLonLat } from 'ol/proj';
import { getWidth, getHeight } from 'ol/extent';
import transformRotate from '@turf/transform-rotate';
import { point } from '@turf/helpers';
import { Coordinate } from 'ol/coordinate';
import { Feature } from 'ol';
import RealtimeLayerMixin from '../../common/mixins/RealtimeLayerMixin';
import Layer, { LayerOptions } from './Layer';
import { getSourceCoordinates, getMercatorResolution } from '../utils';
import type {
  AnyMapboxMap,
  LayerGetFeatureInfoResponse,
  ViewState,
} from '../../types';
import type { RealtimeTrajectory } from '../../api/typedefs';
import toMercatorExtent from '../../common/utils/toMercatorExtent';
import UserInteractionsLayerMixin, {
  UserInteractionsLayerMixinOptions,
} from '../../common/mixins/UserInteractionsLayerMixin';

export type RealtimeLayerOptions = UserInteractionsLayerMixinOptions &
  LayerOptions;

/**
 * Responsible for loading and display data from a Realtime service.
 *
 * @example
 * import { RealtimeLayer } from 'mobility-toolbox-js/mapbox';
 *
 * const layer = new RealtimeLayer({
 *   apiKey: "yourApiKey"
 *   // url: "wss://api.geops.io/tracker-ws/v1/",
 * });
 *
 *
 * @see <a href="/api/class/src/api/RealtimeAPI%20js~RealtimeAPI%20html">RealtimeAPI</a>
 *
 * @extends {Layer}
 * @implements {UserInteractionsLayerInterface}
 * @implements {RealtimeLayerInterface}
 */
// @ts-ignore
class RealtimeLayer extends RealtimeLayerMixin(
  UserInteractionsLayerMixin(Layer),
) {
  /**
   * Extends Layer
   */
  constructor(options = {}) {
    const canvas = document.createElement('canvas');
    super({
      canvas,
      ...options,
    });

    if (super.defineProperties) {
      super.defineProperties({
        canvas,
        ...options,
      });
    }

    this.source = {
      id: this.id,
      type: 'canvas',
      canvas: this.canvas,
      // Set a default coordinates, it will be overrides on next data update
      coordinates: [
        [0, 0],
        [1, 1],
        [2, 2],
        [0, 0],
      ],
      // Set to true if the canvas source is animated. If the canvas is static, animate should be set to false to improve performance.
      animate: true,
      attribution: this.copyrights && this.copyrights.join(', '),
      loaded: true,
    };

    this.layer = {
      id: `${this.id}-raster`,
      type: 'raster',
      source: this.id,
      layout: {
        visibility: 'visible',
      },
      paint: {
        'raster-opacity': 1,
        'raster-fade-duration': 0,
        'raster-resampling': 'nearest', // important otherwise it looks blurry
      },
    };

    /** @private */
    this.onLoad = this.onLoad.bind(this);

    // /** @private */
    this.onMove = this.onMove.bind(this);

    // /** @private */
    this.onMoveEnd = this.onMoveEnd.bind(this);

    // /** @private */
    this.onZoomEnd = this.onZoomEnd.bind(this);
  }

  /**
   * Initialize the layer.
   *
   * @param {mapboxgl.Map} map A [mapbox Map](https://docs.mapbox.com/mapbox-gl-js/api/map/).
   * @param {string} beforeId Layer's id before which we want to add the new layer.
   * @override
   */
  // @ts-ignore
  attachToMap(map: AnyMapboxMap) {
    if (!map) {
      return;
    }
    super.attachToMap(map);

    if (map.isStyleLoaded()) {
      this.onLoad();
    }

    this.map.on('load', this.onLoad);
  }

  /**
   * Remove listeners from the Mapbox Map.
   */
  detachFromMap() {
    if (this.map) {
      this.map.off('load', this.onLoad);

      if (this.map.getLayer(this.layer.id)) {
        this.map.removeLayer(this.layer.id);
      }
      if (this.map.getSource(this.id)) {
        this.map.removeSource(this.id);
      }
    }
    super.detachFromMap();
  }

  onLoad() {
    if (!this.map.getSource(this.id)) {
      this.map.addSource(this.id, this.source);
    }
    if (!this.map.getLayer(this.layer.id)) {
      this.map.addLayer(this.layer, this.id);
    }
    this.start();
  }
  // End extends Layer

  /**
   * Extends RealtimeLayerMixin
   */

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
    this.map?.off('move', this.onMove);
    this.map?.off('moveend', this.onMoveEnd);
    this.map?.off('zoomend', this.onZoomEnd);
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
      zoom: this.map.getZoom() - 1,
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
      extent || toMercatorExtent(this.map.getBounds()),
      zoom || Math.floor(this.map.getZoom() - 1),
    );
  }

  /**
   * Send the current bbox to the websocket
   */
  setBbox(extent?: [number, number, number, number], zoom?: number) {
    super.setBbox(
      extent || toMercatorExtent(this.map.getBounds()),
      zoom || this.map.getZoom() - 1,
    );
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
      const source = this.map.getSource(this.id);
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

    if (this.isUpdateBboxOnMoveEnd) {
      this.setBbox();
    }
  }
  // End extends RealtimeLayerMixin

  /**
   * Extends UserInteractionsLayerMixin
   */
  activateUserInteractions() {
    this.deactivateUserInteractions();
    this.map?.on('click', this.onUserClickCallback);
    this.map?.on('mousemove', this.onUserMoveCallback);
  }

  deactivateUserInteractions() {
    this.map?.off('mousemove', this.onUserMoveCallback);
    this.map?.off('click', this.onUserClickCallback);
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
    if (this.userClickCallbacks.length) {
      this.map.getCanvasContainer().style.cursor = features.length
        ? 'pointer'
        : 'auto';
    }
  }
  // End extends UserInteractionsLayerMixin
}

export default RealtimeLayer;
