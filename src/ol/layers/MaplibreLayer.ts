import OlMap from 'ol/Map';
import debounce from 'lodash.debounce';
import { ObjectEvent } from 'ol/Object';
import { MapLibreLayer } from '@geoblocks/ol-maplibre-layer';
import type {
  MapLibreLayerOptions,
  MapLibreOptions,
} from '@geoblocks/ol-maplibre-layer/lib/types/MapLibreLayer';
import { getUrlWithParams } from '../../common/utils';
import MobilityLayerMixin, {
  MobilityLayerOptions,
} from '../mixins/MobilityLayerMixin';

export type MaplibreLayerOptions = MobilityLayerOptions &
  MapLibreLayerOptions & {
    apiKey?: string;
    apiKeyName?: string;
    style?: string | maplibregl.StyleSpecification;
    url?: string;
    mapLibreOptions?: MapLibreOptions;
  };

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
 * @classproperty {string} style - geOps Maps api style.
 * @extends {ol/layer/Layer~Layer}
 * @public
 */
class MaplibreLayer extends MobilityLayerMixin(MapLibreLayer) {
  get mbMap(): maplibregl.Map | undefined {
    // eslint-disable-next-line no-console
    console.warn('MaplibreLayer.mbMap is deprecated. Use layer.maplibreMap.');
    return this.maplibreMap as maplibregl.Map;
  }

  get maplibreMap(): maplibregl.Map | undefined {
    // eslint-disable-next-line no-console
    console.warn(
      'MaplibreLayer.maplibreMap is deprecated. Use layer.mapLibreMap.',
    );
    return this.mapLibreMap as maplibregl.Map;
  }

  // get queryRenderedFeaturesOptions(): maplibregl.QueryRenderedFeaturesOptions {
  //   return this.get('queryRenderedFeaturesOptions');
  // }

  // set queryRenderedFeaturesOptions(
  //   newValue: maplibregl.QueryRenderedFeaturesOptions,
  // ) {
  //   this.set('queryRenderedFeaturesOptions', newValue);
  // }

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
   * @param {string} [options.apiKeyName="key"] The geOps Maps API key name.
   * @param {maplibregl.MapOptions} [options.mapLibreOptions={ interactive: false, trackResize: false, attributionControl: false }] Maplibre map options.
   * @param {string} [options.style="travic_v2"] The geOps Maps API style.
   * @param {string} [options.url="https://maps.geops.io"] The geOps Maps API url.
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
      newOptions.apiKey &&
      newOptions.style
    ) {
      newOptions.mapLibreOptions.style = buildStyleUrl(
        newOptions.url,
        newOptions.style as string,
        newOptions.apiKey,
        newOptions.apiKeyName,
      );
    }
    super(newOptions);
  }

  /**
   * Initialize the layer and listen to feature clicks.
   * @param {ol/Map~Map} map
   */
  attachToMap(map: OlMap) {
    super.attachToMap(map);
    this.updateMaplibreMap();

    const updateMaplibreMapDebounced = debounce(
      this.updateMaplibreMap.bind(this),
      150,
    );
    this.olEventsKeys.push(
      this.on('propertychange', (evt: ObjectEvent) => {
        if (/(url|style)/.test(evt.key)) {
          updateMaplibreMapDebounced();
        }
      }),
    );
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
    return buildStyleUrl(
      this.url,
      this.style,
      this.get('apiKey'),
      this.get('apiKeyName'),
    );
  }

  updateMaplibreMap() {
    this.mapLibreMap?.setStyle(this.getStyle(), { diff: false });
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
