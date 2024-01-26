/* eslint-disable no-underscore-dangle */
// @ts-nocheck
import Source from 'ol/source/Source';
import OlMap from 'ol/Map';
import BaseEvent from 'ol/events/Event';
import Layer from 'ol/layer/Layer';
import debounce from 'lodash.debounce';
import { ObjectEvent } from 'ol/Object';
import { getUrlWithParams, getMapboxMapCopyrights } from '../../common/utils';
import { AnyMapboxMap } from '../../types';
import { OlLayerOptions } from './Layer';
import OlMobilityLayerMixin from '../mixins/OlMobilityLayerMixin';

export type MapGlLayerOptions = OlLayerOptions & {
  apiKey?: string;
  apiKeyName?: string;
  style?: string;
  url?: string;
};

/**
 * Common class for Mapbox and Maplibre and potential other fork from Mapbox.
 * It's used to share code between Mapbox and Maplibre layers without importing both libs.
 * @private
 */
class MapGlLayer extends OlMobilityLayerMixin(Layer) {
  loaded!: boolean;

  mbMap?: AnyMapboxMap;

  get apiKey(): string {
    return this.get('apiKey');
  }

  set apiKey(newValue: string) {
    return this.set('apiKey', newValue);
  }

  get apiKeyName(): string {
    return this.get('apiKeyName');
  }

  set apiKeyName(newValue: string) {
    return this.set('apiKeyName', newValue);
  }

  get style(): string {
    return this.get('style');
  }

  set style(newValue: string) {
    return this.set('style', newValue);
  }

  get url(): string {
    return this.get('url');
  }

  set url(newValue: string) {
    return this.set('url', newValue);
  }

  get queryRenderedFeaturesOptions(): QueryRenderedFeaturesOptions {
    return this.get('queryRenderedFeaturesOptions');
  }

  set queryRenderedFeaturesOptions(newValue: QueryRenderedFeaturesOptions) {
    return this.set('queryRenderedFeaturesOptions', newValue);
  }

  constructor(options: MapGlLayerOptions = {}) {
    super({
      source: new Source({
        attributions: () => {
          return getMapboxMapCopyrights(this.mbMap);
        },
      }),
      apiKeyName: 'key',
      style: 'travic_v2',
      url: 'https://maps.geops.io',
      ...options,
      mapOptions: {
        interactive: false,
        trackResize: false,
        attributionControl: false,
        ...(options.mapOptions || {}),
      },
      queryRenderedFeaturesOptions: {
        ...(options.queryRenderedFeaturesOptions || {}),
      },
    });

    this.updateMbMapDebounced = debounce(this.updateMbMap, 150);
  }

  /**
   * Initialize the layer and listen to feature clicks.
   * @param {ol/Map~Map} map
   */
  attachToMap(map: OlMap) {
    super.attachToMap(map);
    this.loadMbMap();

    this.olListenersKeys.push(
      this.on('propertychange', (evt: ObjectEvent) => {
        if (/(apiKey|apiKeyName|url|style|)/.test(evt.key)) {
          this.updateMbMapDebounced();
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
   * Create the mapbox map.
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
     * A mapbox map
     * @type {mapboxgl.Map}
     */
    this.mbMap = this.createMap({
      // https://maps.geops.io/styles/t7ravic_v2/style.json',
      style: this.getStyleUrl(),
      container,
      ...(this.options.mapOptions || {}),
    });

    this.mbMap.on('sourcedata', () => {
      this.getSource()?.refresh(); // Refresh attribution
    });

    this.mbMap.once('load', () => {
      this.loaded = true;
      this.dispatchEvent(new BaseEvent('load'));
    });
  }

  getStyleUrl() {
    return getUrlWithParams(`${this.url}/styles/${this.style}/style.json`, {
      [this.apiKeyName]: this.apiKey,
    }).toString();
  }

  updateMbMap() {
    if (this.mbMap) {
      this.mbMap.setStyle(this.getStyleUrl(), { diff: false });
    }
  }
}

export default MapGlLayer;
