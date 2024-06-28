// @ts-nocheck
import { fromLonLat } from 'ol/proj';
import { getWidth, getHeight } from 'ol/extent';
import transformRotate from '@turf/transform-rotate';
import { point } from '@turf/helpers';
import RealtimeLayerMixin, {
  RealtimeLayerMixinOptions,
} from '../../common/mixins/RealtimeLayerMixin';
import Layer, { LayerOptions } from './Layer';
import { getSourceCoordinates } from '../utils';
import type { AnyMapGlMap, ViewState } from '../../types';
import type { RealtimeTrajectory } from '../../api/typedefs';
import toMercatorExtent from '../../common/utils/toMercatorExtent';

export type RealtimeLayerOptions = LayerOptions & RealtimeLayerMixinOptions;

/**
 * A Maplibre layer able to display data from the [geOps Realtime API](https://developer.geops.io/apis/realtime/).
 *
 * @example
 * import { Map } from 'maplibre-gl';
 * import { RealtimeLayer } from 'mobility-toolbox-js/maplibre';
 *
 * // Define the map
 * const map = new Map({ ... });
 *
 * // Define your layer map
 * const layer = new RealtimeLayer({
 *   apiKey: "yourApiKey"
 *   // url: "wss://api.geops.io/tracker-ws/v1/",
 * });
 *
 * // Add the layer to your map *
 * map.on('load', () => {
 *   map.addLayer(layer);
 * });
 *
 *
 * @see <a href="/api/class/src/api/RealtimeAPI%20js~RealtimeAPI%20html">RealtimeAPI</a>
 * @see <a href="/example/mb-realtime>Live example</a>
 *
 * @implements {maplibregl.CustomLayerInterface}
 * @extends {maplibregl.Evented}
 * @classproperty {function} filter - Filter out a train. This function must be fast, it is executed for every trajectory on every render frame.
 * @classproperty {RealtimeMode} mode - The realtime mode to use.
 * @classproperty {RealtimeMot[]} mots - Filter trains by its mode of transportation. It filters trains on backend side.
 * @classproperty {RealtimeTenant} tenant - Filter trains by its tenant. It filters trains on backend side.
 * @classproperty {function} sort - Sort trains. This function must be fast, it is executed on every render frame.
 * @classproperty {function} style - Function to style the vehicles.
 s
 * @public
 */
class RealtimeLayer extends RealtimeLayerMixin(Layer) {
  /**
   * Constructor.
   *
   * @param {RealtimeLayerOptions} options
   * @param {string} options.apiKey Access key for [geOps apis](https://developer.geops.io/).
   * @param {FilterFunction} options.filter Filter out a train. This function must be fast, it is executed for every trajectory on every render frame.
   * @param {getMotsByZoomFunction} options.getMotsByZoom Returns for each zoom level the list of MOTs to display. It filters trains on backend side.
   * @param {number} [options.minZoomInterpolation=8] Minimal zoom level where to start to interpolate train positions.
   * @param {RealtimeMode} [options.mode='topographic'] The realtime mode to use.
   * @param {SortFunction} options.sort Sort trains. This function must be fast, it is executed on every render frame.
   * @param {RealtimeStyleFunction} options.style Function to style the vehicles.
   * @param {RealtimeTenant} options.tenant Filter trains by its tenant. It filters trains on backend side.
   * @param {string} [options.url="wss://api.geops.io/tracker-ws/v1/"] The geOps Realtime API url.
   */
  constructor(options = {}) {
    const canvas = document.createElement('canvas');
    super({
      canvas,
      id: 'realtime',
      ...options,
    });

    /** @private */
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
      attribution: options.attribution?.join(', '),
      loaded: true,
    };

    /** @private */
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

    /** @private */
    this.onMove = this.onMove.bind(this);

    /** @private */
    this.onMoveEnd = this.onMoveEnd.bind(this);

    /** @private */
    this.onZoomEnd = this.onZoomEnd.bind(this);
  }

  /**
   * Add sources, layers and listeners to the map.
   */
  override onAdd(
    map: AnyMapGlMap,
    gl: WebGLRenderingContext | WebGL2RenderingContext,
  ) {
    super.onAdd(map, gl);

    if (map.isStyleLoaded()) {
      this.onLoad();
    }

    map.on('load', this.onLoad);
  }

  /**
   * Remove source, layers and listeners from the map.
   */
  override onRemove(
    map: AnyMapGlMap,
    gl: WebGLRenderingContext | WebGL2RenderingContext,
  ) {
    map.off('load', this.onLoad);

    if (map.getLayer(this.layer.id)) {
      map.removeLayer(this.layer.id);
    }
    if (map.getSource(this.id)) {
      map.removeSource(this.id);
    }
    super.onRemove(map, gl);
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

  /**
   * Start updating vehicles position.
   *
   * @public
   */
  override start() {
    super.start();
    this.map.on('move', this.onMove);
    this.map.on('moveend', this.onMoveEnd);
    this.map.on('zoomend', this.onZoomEnd);
  }

  /**
   * Stop updating vehicles position.
   *
   * @public
   */
  override stop() {
    super.stop();
    this.map?.off('move', this.onMove);
    this.map?.off('moveend', this.onMoveEnd);
    this.map?.off('zoomend', this.onZoomEnd);
  }

  /**
   * Render the trajectories using current map's size, resolution and rotation.
   * @param {boolean} noInterpolate if true, renders the vehicles without interpolating theirs positions.
   * @private
   */
  override renderTrajectories(noInterpolate?: boolean = false) {
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
  override getRefreshTimeInMs() {
    return super.getRefreshTimeInMs(this.map.getZoom());
  }

  /**
   * Remove the trajectory form the list if necessary.
   */
  override purgeTrajectory(
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
  override setBbox(extent?: [number, number, number, number], zoom?: number) {
    super.setBbox(
      extent || toMercatorExtent(this.map.getBounds()),
      zoom || this.map.getZoom() - 1,
    );
  }

  override renderTrajectoriesInternal(
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
   * Callback on 'move' event.
   */
  onMove() {
    this.renderTrajectories();
  }

  /**
   * Callback on 'moveend' event.
   */
  onMoveEnd() {
    this.renderTrajectories();

    if (this.isUpdateBboxOnMoveEnd) {
      this.setBbox();
    }
  }
}

export default RealtimeLayer;
