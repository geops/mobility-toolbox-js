import Source from 'ol/source/Source';
import OlMap from 'ol/Map';
import BaseEvent from 'ol/events/Event';
import Layer from 'ol/layer/Layer';
import debounce from 'lodash.debounce';
import { ObjectEvent } from 'ol/Object';
import { getUrlWithParams, getMapGlCopyrights } from '../../common/utils';
import { AnyMapGlMap } from '../../types';
import MobilityLayerMixin, {
  MobilityLayerOptions,
} from '../mixins/MobilityLayerMixin';

export type MapGlLayerOptions = MobilityLayerOptions & {
  apiKey?: string;
  apiKeyName?: string;
  style?: string | maplibregl.StyleSpecification;
  url?: string;
  mapOptions: maplibregl.MapOptions;
  queryRenderedFeaturesOptions: maplibregl.QueryRenderedFeaturesOptions;
};

/**
 * Common class for Maplibre and Maplibre and potential other fork from Maplibre.
 * It's used to share code between Maplibre and Maplibre layers without importing both libs.
 * @private
 */
class MapGlLayer extends MobilityLayerMixin(Layer) {
  loaded!: boolean;

  mbMap?: AnyMapGlMap;

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

  get queryRenderedFeaturesOptions(): maplibregl.QueryRenderedFeaturesOptions {
    return this.get('queryRenderedFeaturesOptions');
  }

  set queryRenderedFeaturesOptions(
    newValue: maplibregl.QueryRenderedFeaturesOptions,
  ) {
    this.set('queryRenderedFeaturesOptions', newValue);
  }

  constructor(options: MapGlLayerOptions) {
    super({
      source: new Source({
        attributions: () => {
          return (this.mbMap && getMapGlCopyrights(this.mbMap)) || [];
        },
      }),
      apiKeyName: 'key',
      style: 'travic_v2',
      url: 'https://maps.geops.io',
      ...(options || {}),
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

    const updateMbMapDebounced = debounce(this.updateMbMap.bind(this), 150);
    this.olListenersKeys.push(
      this.on('propertychange', (evt: ObjectEvent) => {
        if (/(apiKey|apiKeyName|url|style|)/.test(evt.key)) {
          updateMbMapDebounced();
        }
      }),
    );
  }

  /**
   * Terminate what was initialized in init function. Remove layer, events...
   */
  detachFromMap() {
    if (this.mbMap) {
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
   * Create the Maplibre map.
   * @private
   */
  loadMbMap() {
    this.loaded = false;
    this.olListenersKeys.push(
      // @ts-ignore
      this.map?.on('change:target', this.loadMbMap),
    );

    if (!this.map?.getTargetElement()) {
      return;
    }

    if (!this.visible) {
      // On next change of visibility we load the map
      this.olListenersKeys.push(
        // @ts-ignore
        this.once('change:visible', this.loadMbMap),
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
    this.mbMap = this.createMap({
      // https://maps.geops.io/styles/t7ravic_v2/style.json',
      style: this.getStyle(),
      container,
      ...(this.options?.mapOptions || {}),
    });

    this.mbMap.on('sourcedata', () => {
      this.getSource()?.refresh(); // Refresh attribution
    });

    this.mbMap.once('load', () => {
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

  // eslint-disable-next-line class-methods-use-this, @typescript-eslint/no-unused-vars
  createMap(options: { [id: string]: any }): AnyMapGlMap {
    throw new Error('createMap must be implemented in child class');
  }

  updateMbMap() {
    this.mbMap?.setStyle(this.getStyle(), { diff: false });
  }
}

export default MapGlLayer;
