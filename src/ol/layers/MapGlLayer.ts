/* eslint-disable max-classes-per-file */
import { toLonLat } from 'ol/proj';
import OlLayer, { RenderFunction } from 'ol/layer/Layer';
import Source from 'ol/source/Source';
import GeoJSON from 'ol/format/GeoJSON';
import OlMap from 'ol/Map';
import { Coordinate } from 'ol/coordinate';
import BaseEvent from 'ol/events/Event';
import { getUrlWithParams, getMapboxMapCopyrights } from '../../common/utils';
import {
  AnyMapboxMap,
  AnyMapboxMapClass,
  LayerGetFeatureInfoResponse,
} from '../../types';
import Layer, { OlLayerOptions } from './Layer';

export type MapGlLayerOptions = OlLayerOptions & {
  url?: string;
  apiKey?: string;
  apiKeyName?: string;
  mapOptions?: any;
  tabIndex?: number;
};

/**
 * Common class for Mapbox and Maplibre and potential other fork from Mapbox.
 * It's used to share code between Mapbox and Maplibre layers without importing both libs.
 */
class MapGlLayer extends Layer {
  mbMap?: AnyMapboxMap;

  styleUrl?: string;

  apiKey?: string;

  apiKeyName!: string;

  format!: GeoJSON;

  loaded!: boolean;

  options!: MapGlLayerOptions;

  constructor(options: MapGlLayerOptions) {
    super(options);

    this.olLayer = new OlLayer({
      source: new Source({}),
      render: this.getOlLayerRender(),
    });

    /**
     * Url of the mapbox style.
     * @type {string}
     * @private
     */
    this.styleUrl = options.url;

    /**
     * Api key for the url of the mapbox style.
     * If set to false, the apiKey is not required.
     * @type {string}
     * @private
     */
    this.apiKey = options.apiKey;

    /**
     * Name of the apiKey to set in the url request.
     * Default is 'key'.
     * @type {string}
     * @private
     */
    this.apiKeyName = options.apiKeyName || 'key';

    /** @ignore */
    this.updateAttribution = this.updateAttribution.bind(this);
  }

  /**
   * Initialize the layer and listen to feature clicks.
   * @param {ol/Map~Map} map
   */
  attachToMap(map: OlMap) {
    super.attachToMap(map);

    if (!this.map) {
      return;
    }

    /**
     * The feature format.
     * @type {ol/format/GeoJSON}
     */
    this.format = new GeoJSON({
      featureProjection: this.map.getView().getProjection(),
    });

    this.loadMbMap();
  }

  /**
   * Terminate what was initialized in init function. Remove layer, events...
   */
  detachFromMap() {
    if (this.mbMap) {
      this.mbMap.off('idle', this.updateAttribution);
      // Some asynchrone repaints are triggered even if the mbMap has been removed,
      // to avoid display of errors we set an empty function.
      this.mbMap.triggerRepaint = () => {};
      this.mbMap.remove();
      this.mbMap = undefined;
    }
    this.loaded = false;
    super.detachFromMap();
  }

  /**
   * Create the mapbox map.
   * @private
   */
  loadMbMap() {
    this.olListenersKeys.push(
      // @ts-ignore
      this.map?.on('change:target', () => {
        this.loadMbMap();
      }),
    );

    if (!this.map?.getTargetElement()) {
      return;
    }

    if (!this.visible) {
      // On next change of visibility we load the map
      this.olListenersKeys.push(
        // @ts-ignore
        this.once('change:visible', () => {
          this.loadMbMap();
        }),
      );
      return;
    }

    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.width = '100%';
    container.style.height = '100%';

    if (!this.styleUrl) {
      // eslint-disable-next-line no-console
      console.error(`No styleUrl defined for mapbox layer: ${this.styleUrl}`);
      return;
    }

    if (!this.apiKey && !this.styleUrl?.includes(this.apiKeyName)) {
      // eslint-disable-next-line no-console
      console.error(
        `No apiKey defined for mapbox layer with style url to ${this.styleUrl}`,
      );
    }

    const Map = this.getMapboxMapClass();

    /**
     * A mapbox map
     * @type {mapboxgl.Map}
     */
    this.mbMap = new Map({
      style: getUrlWithParams(this.styleUrl, {
        [this.apiKeyName]: this.apiKey,
      }).toString(),
      container,
      interactive: false,
      trackResize: false,
      attributionControl: false,
      ...(this.options.mapOptions || {}),
    });

    this.mbMap.once('load', () => {
      /**
       * Is the map loaded.
       * @type {boolean}
       */
      this.loaded = true;

      this.dispatchEvent(new BaseEvent('load'));
    });

    this.mbMap.on('idle', this.updateAttribution);
  }

  /**
   * Update attributions of the source.
   * @private
   */
  updateAttribution(evt: maplibregl.MapLibreEvent | mapboxgl.MapboxEvent) {
    const newAttributions = getMapboxMapCopyrights(evt.target) || [];
    if (this.copyrights?.toString() !== newAttributions.toString()) {
      this.copyrights = newAttributions;
      // @ts-ignore
      this.olLayer?.getSource()?.setAttributions(newAttributions);
    }
  }

  /**
   * Request feature information for a given coordinate.
   * @param {ol/coordinate~Coordinate} coordinate Coordinate to request the information at.
   * @param {Object} options A [mapboxgl.Map#queryrenderedfeatures](https://docs.mapbox.com/mapbox-gl-js/api/map/#map#queryrenderedfeatures) options parameter.
   * @return {Promise<FeatureInfo>} Promise with features, layer and coordinate. The original Mapbox feature is available as a property named 'mapboxFeature'.
   */
  getFeatureInfoAtCoordinate(
    coordinate: Coordinate,
    options: any,
  ): Promise<LayerGetFeatureInfoResponse> {
    // Ignore the getFeatureInfo until the mapbox map is loaded
    if (
      !options ||
      !this.format ||
      !this.mbMap ||
      !this.mbMap.isStyleLoaded()
    ) {
      return Promise.resolve({ coordinate, features: [], layer: this });
    }

    const pixel =
      coordinate &&
      this.mbMap.project(toLonLat(coordinate) as [number, number]);
    let pixels: [mapboxgl.PointLike, mapboxgl.PointLike];

    if (this.hitTolerance) {
      const { x, y } = pixel;
      pixels = [
        {
          x: x - this.hitTolerance,
          y: y - this.hitTolerance,
        } as mapboxgl.PointLike,
        {
          x: x + this.hitTolerance,
          y: y + this.hitTolerance,
        } as mapboxgl.PointLike,
      ];
    }

    // At this point we get GeoJSON Mapbox feature, we transform it to an OpenLayers
    // feature to be consistent with other layers.
    const features = this.mbMap
      // @ts-ignore
      .queryRenderedFeatures(pixels || pixel, options)
      .map((feature) => {
        const olFeature = this.format.readFeature(feature);
        if (olFeature) {
          // We save the original mapbox feature to avoid losing informations
          // potentially needed for other functionnality like highlighting
          // (id, layer id, source, sourceLayer ...)
          olFeature.set('mapboxFeature', feature);
        }
        return olFeature;
      });

    return Promise.resolve({
      layer: this,
      features,
      coordinate,
    });
  }

  /**
   * Return the render function function for the ol layer.
   *
   */
  // eslint-disable-next-line class-methods-use-this
  getOlLayerRender(): RenderFunction {
    // eslint-disable-next-line no-console
    console.error('This function must be implemented in subclasses');
    const div = document.createElement('div');
    return () => div;
  }

  /**
   * Return the Class to instanciate for the mapbox map.
   *
   * @return {mapboxgl.Map|maplibregl.Map} map
   */
  // eslint-disable-next-line class-methods-use-this
  getMapboxMapClass(): AnyMapboxMapClass {
    // eslint-disable-next-line no-console
    console.error('This function must be implemented in subclasses');
    // @ts-ignore
    return null;
  }
}

export default MapGlLayer;
