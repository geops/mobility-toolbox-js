import type {
  MapLibreLayerOptions,
  MapLibreOptions,
} from '@geoblocks/ol-maplibre-layer/lib/MapLibreLayer';
import type { QueryRenderedFeaturesOptions } from 'maplibre-gl';

import { MapLibreLayer } from '@geoblocks/ol-maplibre-layer/lib';
import debounce from 'lodash.debounce';
import { EventsKey } from 'ol/events';
import Map from 'ol/Map';
import { ObjectEvent } from 'ol/Object';
import { unByKey } from 'ol/Observable';

import { getUrlWithParams } from '../../common/utils';
import MaplibreLayerRenderer from '../renderers/MaplibreLayerRenderer';
import defineDeprecatedProperties from '../utils/defineDeprecatedProperties';
import { MobilityLayerOptions } from './Layer';

export type MaplibreLayerOptions = {
  apiKey?: string;
  apiKeyName?: string;
  mapLibreOptions?: MapLibreOptions;
  queryRenderedFeaturesOptions?: QueryRenderedFeaturesOptions | undefined;
  style?: maplibregl.StyleSpecification | null | string;
  url?: string;
} & MobilityLayerOptions &
  Omit<MapLibreLayerOptions, 'mapLibreOptions'>;

const buildStyleUrl = (
  url: string,
  style: string,
  apiKey: string,
  apiKeyName: string,
) => {
  return getUrlWithParams(`${url}/styles/${style}/style.json`, {
    [apiKeyName]: apiKey,
  }).toString();
};

let deprecated: (message: string) => void = () => {};
if (
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get('deprecated')
) {
  deprecated = debounce((message: string) => {
    console.warn(message);
  }, 1000);
}

/**
 * An OpenLayers layer able to display data from the [geOps Maps API](https://developer.geops.io/apis/maps).
 *
 * @example
 * import { MaplibreLayer } from 'mobility-toolbox-js/ol';
 *
 * const layer = new MaplibreLayer({
 *   apiKey: 'yourApiKey',
 *   // apiKeyName: 'key',
 *   // mapLibreOptions: {
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
 * @classproperty {maplibregl.Map} mapLibreMap - The Maplibre map object. Readonly.
 * @classproperty {string} style - The [geOps Maps API](https://developer.geops.io/apis/maps) style.
 *
 *
 * @see <a href="/example/ol-maplibre-layer">OpenLayers Maplibre layer example</a>
 *
 * @extends {geoblocks/ol-maplibre-layer/MapLibreLayer}
 * @public
 */
class MaplibreLayer extends MapLibreLayer {
  public olEventsKeys: EventsKey[] = [];

  set apiKey(newValue: string) {
    this.set('apiKey', newValue);
  }
  get apiKey(): string {
    return this.get('apiKey') as string;
  }

  set apiKeyName(newValue: string) {
    this.set('apiKeyName', newValue);
  }

  get apiKeyName(): string {
    return this.get('apiKeyName') as string;
  }

  /**
   * @deprecated Use layer.mapLibreMap.
   */
  get maplibreMap(): maplibregl.Map | undefined {
    deprecated(
      'MaplibreLayer.maplibreMap is deprecated. Use layer.mapLibreMap.',
    );
    return this.mapLibreMap!;
  }

  // get queryRenderedFeaturesOptions(): maplibregl.QueryRenderedFeaturesOptions {
  //   return this.get('queryRenderedFeaturesOptions');
  // }

  // set queryRenderedFeaturesOptions(
  //   newValue: maplibregl.QueryRenderedFeaturesOptions,
  // ) {
  //   this.set('queryRenderedFeaturesOptions', newValue);
  // }

  /**
   * @deprecated Use layer.mapLibreMap.
   */
  get mbMap(): maplibregl.Map | undefined {
    deprecated('MaplibreLayer.mbMap is deprecated. Use layer.maplibreMap.');
    return this.maplibreMap!;
  }

  get style(): string {
    return this.get('style') as string;
  }

  set style(newValue: string) {
    this.set('style', newValue);
  }

  get url(): string {
    return this.get('url') as string;
  }

  set url(newValue: string) {
    this.set('url', newValue);
  }

  /**
   * Constructor.
   *
   * @param {Object} options
   * @param {string} options.apiKey Accesss key for [geOps APIs](https://developer.geops.io/).
   * @param {string} [options.apiKeyName="key"] The [geOps Maps API](https://developer.geops.io/apis/maps) key name.
   * @param {maplibregl.MapOptions} [options.mapLibreOptions={ interactive: false, trackResize: false, attributionControl: false }] MapLibre map options.
   * @param {string} [options.style="travic_v2"] The [geOps Maps API](https://developer.geops.io/apis/maps) style.
   * @param {string} [options.url="https://maps.geops.io"] The [geOps Maps API](https://developer.geops.io/apis/maps) url.
   */
  constructor(options: MaplibreLayerOptions) {
    const newOptions = {
      apiKeyName: 'key',
      style: 'travic_v2',
      url: 'https://maps.geops.io',
      ...(options || {}),
      mapLibreOptions: {
        ...(options.mapLibreOptions || {}),
      },
    };

    if (
      !newOptions.mapLibreOptions.style &&
      newOptions.url?.includes('style.json')
    ) {
      newOptions.mapLibreOptions.style = newOptions.url;
    } else if (
      !newOptions.mapLibreOptions.style &&
      newOptions.apiKey &&
      newOptions.style &&
      typeof newOptions.style === 'string'
    ) {
      newOptions.mapLibreOptions.style = buildStyleUrl(
        newOptions.url,
        newOptions.style,
        newOptions.apiKey,
        newOptions.apiKeyName,
      );
    }
    super(newOptions);

    // For backward compatibility with v2
    defineDeprecatedProperties(this, options);

    // We save the options to be able to clone the layer.
    // and to see if the style is defined by the maplibreOptions given by the user.
    this.set('options', options);
  }

  /**
   * Initialize the layer and listen to feature clicks.
   */
  attachToMap() {
    const updateMaplibreMapDebounced = debounce(
      this.updateMaplibreMap.bind(this),
      150,
    );
    updateMaplibreMapDebounced();
    this.olEventsKeys.push(
      this.on('propertychange', (evt: ObjectEvent) => {
        if (/(url|style|apiKey|apiKeyName)/.test(evt.key)) {
          updateMaplibreMapDebounced();
        }
      }),
    );
  }

  /**
   * Create a copy of the MaplibreLayer.
   *
   * @param {Object} newOptions Options to override. See constructor.
   * @return {MaplibreLayer} A MaplibreLayer layer
   * @public
   */
  clone(newOptions: MaplibreLayerOptions): MaplibreLayer {
    return new MaplibreLayer({
      ...(this.get('options') || {}),
      ...(newOptions || {}),
    });
  }

  override createRenderer() {
    return new MaplibreLayerRenderer(this);
  }

  detachFromMap() {
    unByKey(this.olEventsKeys);
  }

  override disposeInternal() {
    const source = this.getSource();
    super.disposeInternal();

    // We don't want the source removed
    this.setSource(source);
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

    // If the user has defined the style by the maplibreOptions, we use it directly.
    const opts = this.get('options') as MaplibreLayerOptions;
    if (opts?.mapLibreOptions?.style) {
      return opts.mapLibreOptions.style;
    }

    /// Otherwise build the complete style url.
    return buildStyleUrl(this.url, this.style, this.apiKey, this.apiKeyName);
  }

  override setMapInternal(map: Map) {
    if (map) {
      super.setMapInternal(map);
      this.attachToMap();
    } else {
      this.detachFromMap();
      super.setMapInternal(map);
    }
  }

  updateMaplibreMap() {
    try {
      this.mapLibreMap?.setStyle(this.getStyle(), { diff: false });
    } catch (e) {
      console.error('Error while updating MaplibreMap', e);
    }
  }
}

export default MaplibreLayer;
