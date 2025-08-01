import {
  getMocoIconRefFeatures,
  getMocoNotificationsAsFeatureCollection,
  isMocoNotificationActive,
  isMocoNotificationPublished,
  MocoAPI,
} from '..';

import MaplibreStyleLayer from './MaplibreStyleLayer';

import type { GeoJSONSource, LayerSpecification } from 'maplibre-gl';
import type { Map } from 'ol';

import type { MocoAPIOptions } from '../../api/MocoAPI';
import type { MocoDefinitions, MocoNotification } from '../../types';

import type { MaplibreStyleLayerOptions } from './MaplibreStyleLayer';

export const MOCO_SOURCE_ID = 'moco';
export const MOCO_MD_LAYER_FILTER = 'moco';
export const DEFAULT_GRAPH_MAPPING = { 1: 'osm' };

export type MocoLayerOptions = {
  date?: Date;
  loadAll?: boolean;
  notifications?: MocoNotification[];
  tenant?: string;
  url?: string;
} & MaplibreStyleLayerOptions &
  Pick<MocoAPIOptions, 'apiKey' | 'url'>;

export type MocoNotificationToRender = {
  features?: ({
    // geometry?: GeoJSON.Geometry;
  } & MocoDefinitions['AffectedLinesFeature'])[];
  properties: {
    iPublished?: boolean;
    isActive?: boolean;
  } & MocoDefinitions['FeatureCollectionProperties'];
} & Omit<MocoNotification, 'features' | 'properties'>;

/**
 * An OpenLayers layer able to display data from the [geOps MOCO API](https://geops.com/de/solution/disruption-information).
 *
 * @example
 * import { MaplibreLayer, MaplibreStyleLayer } from 'mobility-toolbox-js/ol';
 *
 * const maplibreLayer = new MaplibreLayer({
 *   apiKey: 'yourApiKey',
 * });
 *
 * const layer = new MocoLayer({
 *   apiKey: 'yourApiKey',
 *   maplibreLayer: maplibreLayer,
 *   // date: new Date(),
 *   // loadAll: true,
 *   // notifications: undefined,
 *   // tenant: "geopstest",
 *   // url: 'https://moco.geops.io'
 * });
 *
 * @see <a href="/example/ol-maplibre-style-layer">OpenLayers MaplibreStyle layer example</a>
 * @extends {MaplibreStyleLayer}
 * @private
 */
class MocoLayer extends MaplibreStyleLayer {
  get apiKey(): string {
    return this.get('apiKey') as string;
  }
  set apiKey(value: string) {
    this.set('apiKey', value);
    void this.updateData();
  }

  get date(): Date {
    return (this.get('date') as Date) || new Date();
  }

  set date(value: Date) {
    this.set('date', value);
    void this.updateData();
  }

  get loadAll(): boolean {
    return (this.get('loadAll') as boolean) ?? true;
  }

  set loadAll(value: boolean) {
    this.set('loadAll', value);
    void this.updateData();
  }

  get notifications(): MocoNotification[] | undefined {
    return this.get('notifications') as MocoNotification[] | undefined;
  }

  set notifications(value: MocoNotification[]) {
    this.set('notifications', value);
    void this.updateData();
  }

  get tenant(): string | undefined {
    return this.get('tenant') as string | undefined;
  }

  set tenant(value: string) {
    this.set('tenant', value);
    void this.updateData();
  }
  get url(): string | undefined {
    return this.get('url') as string | undefined;
  }

  set url(value: string) {
    this.set('url', value);
    void this.updateData();
  }
  #abortController: AbortController | null = null;

  #graphMapping: Record<number, string> = DEFAULT_GRAPH_MAPPING;

  /**
   * Constructor.
   *
   * @param {Object} options
   * @param {string} options.apiKey Access key for [geOps APIs](https://developer.geops.io/).   *
   * @param {string} [options.date] The date to filter notifications. If not set, the current date is used.
   * @param {boolean} [options.loadAll=true] If true, all active and published notifications will be loaded, otherwise only the notifications set in 'notifications' will be displayed.
   * @param {MocoNotification[]} [options.notifications] The notifications to display. If not set and loadAll is true, all active and published notifications will be loaded.
   * @param {string} [options.tenant] The SSO config to use to get notifications from.
   * @param {string} [options.url] The URL of the [geOps MOCO API](https://geops.com/de/solution/disruption-information).
   * @public
   */
  constructor(options: MocoLayerOptions) {
    super({
      ...options,
      layersFilter: ({ metadata }: LayerSpecification) => {
        return (
          (metadata as { 'general.filter': string })?.['general.filter'] ===
          MOCO_MD_LAYER_FILTER
        );
      },
      maplibreLayer: options.maplibreLayer,
      // sources: {
      //   [MOCO_SOURCE_ID]: {
      //     data: {
      //       features: [],
      //       type: 'FeatureCollection',
      //     },
      //     type: 'geojson',
      //   },
      // },
    });
  }

  override attachToMap(map: Map) {
    super.attachToMap(map);

    // If the source is already there (no load event triggered) update data
    const source = this.maplibreLayer?.mapLibreMap?.getSource(MOCO_SOURCE_ID);
    if (source) {
      void this.updateData();
    }
  }

  override detachFromMap() {
    super.detachFromMap();
    const source = this.maplibreLayer?.mapLibreMap?.getSource(MOCO_SOURCE_ID);
    if (source) {
      // Remove the data from the map
      (source as GeoJSONSource).setData({
        features: [],
        type: 'FeatureCollection',
      });
    }

    if (this.#abortController) {
      this.#abortController.abort();
      this.#abortController = null;
    }
  }

  onLoad() {
    super.onLoad();
    void this.updateData();
  }

  async updateData() {
    if (this.#abortController) {
      this.#abortController.abort();
    }
    this.#abortController = new AbortController();

    // Get graphs mapping
    const styleMetadata = this.maplibreLayer?.mapLibreMap?.getStyle()
      ?.metadata as { graphs?: Record<number, string> };
    this.#graphMapping = styleMetadata?.graphs || DEFAULT_GRAPH_MAPPING;
    const graphsString = [...new Set(Object.values(this.#graphMapping))].join(
      ',',
    );

    // We get the data from the MocoAPI
    const api = new MocoAPI({
      apiKey: this.apiKey,
      graph: graphsString,
      ssoConfig: this.tenant,
      url: this.url,
    });

    const date = this.date;

    let notifications = this.notifications;

    if (!notifications && this.loadAll) {
      notifications = await api.getNotifications(
        { date: date },
        { signal: this.#abortController.signal },
      );
    }

    const source = this.maplibreLayer?.mapLibreMap?.getSource(MOCO_SOURCE_ID);
    if (!source) {
      console.warn('MocoLayer: No source found for id : ', MOCO_SOURCE_ID);
      return;
    }

    const notifsToRender: MocoNotificationToRender[] = (notifications ?? [])
      .map((notification) => {
        // Add status properties to the features, these properties are only there for rendering purposes
        return {
          ...notification,
          properties: {
            ...notification.properties,
            isActive: isMocoNotificationActive(notification.properties, date),
            isPublished: isMocoNotificationPublished(
              notification.properties,
              date,
            ),
          },
        };
      })
      .filter((n) => {
        return n.properties.isPublished || n.properties.isActive;
      });

    notifsToRender.forEach((notification) => {
      // Add icon ref features, these features are only there for rendering purposes
      const iconRefFeatures = getMocoIconRefFeatures(notification);
      notification.features?.push(...iconRefFeatures);
    });

    const data = getMocoNotificationsAsFeatureCollection(notifsToRender);

    // Apply new data to the source
    (source as GeoJSONSource).setData(data);

    return true;
  }
}

export default MocoLayer;
