import { point } from '@turf/helpers';
import transformRotate from '@turf/transform-rotate';
import { CanvasSourceSpecification, LayerSpecification } from 'maplibre-gl';
import { getHeight, getWidth } from 'ol/extent';
import { fromLonLat } from 'ol/proj';

import RealtimeEngine, {
  RealtimeEngineOptions,
} from '../../common/utils/RealtimeEngine';
import { getSourceCoordinates } from '../utils';

import Layer, { LayerOptions } from './Layer';

import type { AnyCanvas, AnyMapGlMap } from '../../types';

export type RealtimeLayerOptions = LayerOptions & RealtimeEngineOptions;

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
 * @see <a href="/example/mb-realtime>MapLibre Realtime layer example</a>
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
class RealtimeLayer extends Layer {
  engine: RealtimeEngine;
  layer: LayerSpecification;
  source: CanvasSourceSpecification;
  sourceId: string;
  get canvas(): AnyCanvas | undefined {
    return this.engine.canvas;
  }

  get pixelRatio(): number | undefined {
    return this.engine.pixelRatio || 1;
  }
  set pixelRatio(pixelRatio: number | undefined) {
    this.engine.pixelRatio = pixelRatio || 1;
  }

  #internalId: string;

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
  constructor(options: RealtimeLayerOptions = {}) {
    const id = options?.id || 'realtime';
    super({
      ...options,
      id: 'realtime-custom-' + id,
    });

    this.#internalId = id;

    this.engine = new RealtimeEngine({
      getViewState: this.getViewState.bind(this),
      onRender: this.onRealtimeEngineRender.bind(this),
      ...options,
    });

    this.sourceId = this.#internalId;
    this.source = {
      // Set to true if the canvas source is animated. If the canvas is static, animate should be set to false to improve performance.
      animate: true,
      // @ts-expect-error bad type definition
      attribution: options.attribution?.join(', '),
      canvas: this.canvas as HTMLCanvasElement,
      // Set a default coordinates, it will be overrides on next data update
      coordinates: [
        [0, 0],
        [1, 1],
        [2, 2],
        [0, 0],
      ],
      loaded: true,
      type: 'canvas',
    };

    this.layer = {
      id: this.#internalId,
      layout: {
        visibility: 'visible',
      },
      paint: {
        'raster-fade-duration': 0,
        'raster-opacity': 1,
        'raster-resampling': 'nearest', // important otherwise it looks blurry
      },
      source: this.sourceId,
      type: 'raster',
    };

    this.onLoad = this.onLoad.bind(this);

    this.onMove = this.onMove.bind(this);

    this.onMoveEnd = this.onMoveEnd.bind(this);

    this.onZoomEnd = this.onZoomEnd.bind(this);
  }

  /**
   * Return the current view state. Used by the RealtimeEngine.
   * @private
   */
  getViewState() {
    if (!this.map) {
      return {};
    }
    if (!this.pixelRatio) {
      this.pixelRatio = 1;
    }

    const { height, width } = this.map.getCanvas();
    const center = this.map.getCenter();

    // We use turf here to have good transform.
    // @ts-expect-error bad type definition
    const leftBottom = this.map.unproject({
      x: 0,
      y: height / this.pixelRatio,
    }); // southWest

    // @ts-expect-error bad type definition
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
    return {
      center: fromLonLat([center.lng, center.lat]),
      extent: bounds,
      pixelRatio: this.pixelRatio,
      resolution: res,
      rotation: -(this.map.getBearing() * Math.PI) / 180,
      size: [width / this.pixelRatio, height / this.pixelRatio],
      visible: true,
      zoom: this.map.getZoom() - 1,
    };
  }

  /**
   * Add sources, layers and listeners to the map.
   */
  override onAdd(
    map: AnyMapGlMap,
    gl: WebGL2RenderingContext | WebGLRenderingContext,
  ) {
    super.onAdd(map, gl);
    this.engine.attachToMap();

    if (map.isStyleLoaded()) {
      this.onLoad();
    }

    map.on('load', this.onLoad);
  }

  onLoad() {
    if (!this.map?.getSource(this.sourceId)) {
      this.map?.addSource(this.sourceId, this.source);
    }
    if (!this.map?.getLayer(this.layer.id)) {
      this.map?.addLayer(this.layer, this.id);
    }
    this.start();
  }

  /**
   * Callback on 'move' event.
   */
  onMove() {
    this.engine.renderTrajectories();
  }

  /**
   * Callback on 'moveend' event.
   */
  onMoveEnd() {
    this.engine.renderTrajectories();

    if (this.engine.isUpdateBboxOnMoveEnd) {
      this.engine.setBbox();
    }
  }

  /**
   * Callback when the RealtimeEngine has rendered successfully.
   */
  onRealtimeEngineRender() {
    if (this.map?.style) {
      const extent = getSourceCoordinates(this.map, this.pixelRatio);
      const source = this.map.getSource(this.sourceId)!;
      if (source) {
        // @ts-expect-error bad type definition
        source.setCoordinates(extent);
      }
    }
  }

  /**
   * Remove source, layers and listeners from the map.
   */
  override onRemove(
    map: AnyMapGlMap,
    gl: WebGL2RenderingContext | WebGLRenderingContext,
  ) {
    this.engine.detachFromMap();
    this.stop();

    map.off('load', this.onLoad);

    if (map.getLayer(this.layer.id)) {
      map.removeLayer(this.layer.id);
    }
    if (map.getSource(this.sourceId)) {
      map.removeSource(this.sourceId);
    }
    super.onRemove(map, gl);
  }

  onZoomEnd() {
    this.engine.onZoomEnd();
  }

  /**
   * Start updating vehicles position.
   *
   * @public
   */
  start() {
    this.engine.start();
    this.map?.on('move', this.onMove);
    this.map?.on('moveend', this.onMoveEnd);
    this.map?.on('zoomend', this.onZoomEnd);
  }

  /**
   * Stop updating vehicles position.
   *
   * @public
   */
  stop() {
    this.engine.stop();
    this.map?.off('move', this.onMove);
    this.map?.off('moveend', this.onMoveEnd);
    this.map?.off('zoomend', this.onZoomEnd);
  }
}

export default RealtimeLayer;
