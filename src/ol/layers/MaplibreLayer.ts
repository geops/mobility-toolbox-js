import Source from 'ol/source/Source';
import OlMap from 'ol/Map';
import BaseEvent from 'ol/events/Event';
import Layer from 'ol/layer/Layer';
import debounce from 'lodash.debounce';
import { ObjectEvent } from 'ol/Object';
import { Map, MapOptions } from 'maplibre-gl';
import { getUrlWithParams, getMapGlCopyrights } from '../../common/utils';
import MobilityLayerMixin, {
  MobilityLayerOptions,
} from '../mixins/MobilityLayerMixin';
import MaplibreLayerRenderer from '../renderers/MaplibreLayerRenderer';

export type MaplibreLayerOptions = MobilityLayerOptions & {
  apiKey?: string;
  apiKeyName?: string;
  style?: string | maplibregl.StyleSpecification;
  url?: string;
  mapOptions?: maplibregl.MapOptions;
  queryRenderedFeaturesOptions?: maplibregl.QueryRenderedFeaturesOptions;
};

/**
 * An OpenLayers layer able to display data from the [geOps Maps API](https://developer.geops.io/apis/maps).
 *
 * @example
 * import { MaplibreLayer } from 'mobility-toolbox-js/ol';
 *
 * const layer = new MaplibreLayer({
 *   apiKey: 'yourApiKey',
 *   // apiKeyName: 'key',
 *   // mapOptions: {
 *   //   interactive: false,
 *   //   trackResize: false,
 *   //   attributionControl: false,
 *   // }
 *   // queryRenderedFeaturesOptions: {
 *   //   layers: ['waters_lakes'], // map.getFeaturesAtPixel will only return lakes.
 *   // },
 *   // style: 'travic_v2',
 *   // url: 'https://maps.geops.io',
 * });
 *
 * @classproperty {maplibregl.Map} maplibreMap - The Maplibre map object. Readonly.
 * @classproperty {maplibregl.QueryRenderedFeaturesOptions} queryRenderedFeaturesOptions - Options used when we query features using map.getFeaturesAtPixel().
 * @classproperty {string} style - geOps Maps api style.
 * @extends {ol/layer/Layer~Layer}
 * @public
 */
class MaplibreLayer extends MobilityLayerMixin(Layer) {
  loaded!: boolean;

  maplibreMap?: Map;

  get apiKey(): string {
    return this.get('apiKey');
  }

  set apiKey(newValue: string) {
    this.set('apiKey', newValue);
  }

  get apiKeyName(): string {
    return this.get('apiKeyName');
  }

  set apiKeyName(newValue: string) {
    this.set('apiKeyName', newValue);
  }

  get mbMap(): maplibregl.Map | undefined {
    console.warn('Deprecated. Use layer.maplibreMap.');
    return this.maplibreMap as maplibregl.Map;
  }

  get queryRenderedFeaturesOptions(): maplibregl.QueryRenderedFeaturesOptions {
    return this.get('queryRenderedFeaturesOptions');
  }

  set queryRenderedFeaturesOptions(
    newValue: maplibregl.QueryRenderedFeaturesOptions,
  ) {
    this.set('queryRenderedFeaturesOptions', newValue);
  }

  get style(): string {
    return this.get('style');
  }

  set style(newValue: string) {
    this.set('style', newValue);
  }

  get url(): string {
    return this.get('url');
  }

  set url(newValue: string) {
    this.set('url', newValue);
  }

  /**
   * Constructor.
   *
   * @param {MaplibreLayerOptions} options
   * @param {string} options.apiKey Access key for [geOps apis](https://developer.geops.io/).
   * @param {string} [options.apiKeyName="key"] The geOps Maps api key name.
   * @param {maplibregl.MapOptions} [options.mapOptions={ interactive: false, trackResize: false, attributionControl: false }] Maplibre map options.
   * @param {string} [options.style="travic_v2"] The geOps Maps api style.
   * @param {string} [options.url="https://maps.geops.io"] The geOps Maps api url.
   */
  constructor(options: MaplibreLayerOptions) {
    super({
      source: new Source({
        attributions: () => {
          return (
            (this.maplibreMap && getMapGlCopyrights(this.maplibreMap)) || []
          );
        },
      }),
      apiKeyName: 'key',
      style: 'travic_v2',
      url: 'https://maps.geops.io',
      ...(options || {}),
      // @ts-expect-error mapOptions must be saved by the mixin in this.options
      mapOptions: {
        interactive: false,
        trackResize: false,
        attributionControl: false,
        ...(options?.mapOptions || {}),
      },
      queryRenderedFeaturesOptions: {
        ...(options?.queryRenderedFeaturesOptions || {}),
      },
    });
  }

  /**
   * Initialize the layer and listen to feature clicks.
   * @param {ol/Map~Map} map
   */
  attachToMap(map: OlMap) {
    super.attachToMap(map);
    this.loadMbMap();

    const updateMaplibreMapDebounced = debounce(
      this.updateMaplibreMap.bind(this),
      150,
    );
    this.olListenersKeys.push(
      this.on('propertychange', (evt: ObjectEvent) => {
        if (/(apiKey|apiKeyName|url|style)/.test(evt.key)) {
          updateMaplibreMapDebounced();
        }
      }),
    );
  }

  /**
   * Terminate what was initialized in init function. Remove layer, events...
   */
  detachFromMap() {
    if (this.maplibreMap) {
      // Some asynchrone repaints are triggered even if the mbMap has been removed,
      // to avoid display of errors we set an empty function.
      this.maplibreMap.triggerRepaint = () => {};
      this.maplibreMap.remove();
      this.maplibreMap = undefined;
    }
    this.loaded = false;
    super.detachFromMap();
  }

  /**
   * Create the Maplibre map.
   * @private
   */
  loadMbMap() {
    this.loaded = false;
    this.olListenersKeys.push(
      // @ts-ignore
      this.map?.on('change:target', this.loadMbMap.bind(this)),
    );

    if (!this.map?.getTargetElement()) {
      return;
    }

    if (!this.visible) {
      // On next change of visibility we load the map
      this.olListenersKeys.push(
        // @ts-ignore
        this.once('change:visible', this.loadMbMap.bind(this)),
      );
      return;
    }

    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.width = '100%';
    container.style.height = '100%';

    /**
     * A Maplibre map
     * @type {maplibregl.Map}
     */
    this.maplibreMap = this.createMap({
      style: this.getStyle(),
      container,
      ...(this.options?.mapOptions || {}),
    });

    this.maplibreMap.on('sourcedata', () => {
      this.getSource()?.refresh(); // Refresh attribution
    });

    this.maplibreMap.once('load', () => {
      this.loaded = true;
      this.dispatchEvent(new BaseEvent('load'));
    });
  }

  getStyle() {
    // If the style is a complete style object, use it directly.
    if (
      this.style &&
      typeof this.style === 'object' &&
      (this.style as maplibregl.StyleSpecification).name &&
      (this.style as maplibregl.StyleSpecification).version
    ) {
      return this.style;
    }
    // If the url set is already a complete style url, use it directly.
    if (this.url.includes('style.json')) {
      return this.url;
    }

    /// Otherwise build the complete style url.
    return getUrlWithParams(`${this.url}/styles/${this.style}/style.json`, {
      [this.apiKeyName]: this.apiKey,
    }).toString();
  }

  // eslint-disable-next-line class-methods-use-this
  createMap(options: MapOptions): Map {
    return new Map(options);
  }

  createRenderer(): MaplibreLayerRenderer {
    return new MaplibreLayerRenderer(this);
  }

  updateMaplibreMap() {
    this.maplibreMap?.setStyle(this.getStyle(), { diff: false });
  }

  /**
   * Create a copy of the MaplibreLayer.
   * @param {MaplibreLayerOptions} newOptions Options to override
   * @return {MaplibreLayer} A MaplibreLayer layer
   */
  clone(newOptions: MaplibreLayerOptions): MaplibreLayer {
    return new MaplibreLayer({
      ...(this.options || {}),
      ...(newOptions || {}),
    });
  }
}

export default MaplibreLayer;
