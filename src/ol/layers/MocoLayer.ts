import { GeoJSONSource, LayerSpecification } from 'maplibre-gl';

import {
  getMocoIconRefFeatures,
  getMocoNotificationsAsFeatureCollection,
  isMocoNotificationActive,
  isMocoNotificationPublished,
  MocoAPI,
} from '..';
import { MocoDefinitions, MocoNotification } from '../../types';
import MaplibreStyleLayer, {
  MaplibreStyleLayerOptions,
} from './MaplibreStyleLayer';

export const MOCO_SOURCE_ID = 'moco';
export const MOCO_MD_LAYER_FILTER = 'moco';
export const DEFAULT_GRAPH_MAPPING = { 1: 'osm' };

export type MocoLayerOptions = {
  date?: Date;
  notifications: MocoNotification[];
  tenant?: string;
} & MaplibreStyleLayerOptions;

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
 * An OpenLayers layer able to display data from the [geOps MOCO API](https://developer.geops.io/apis/realtime/).
 *
 * @example
 * import { MaplibreLayer, MaplibreStyleLayer } from 'mobility-toolbox-js/ol';
 *
 * const maplibreLayer = new MaplibreLayer({
 *   apiKey: 'yourApiKey',
 * });
 *
 * const layer = new MocoLayer({
 *   maplibreLayer: maplibreLayer,
 * });
 *
 * @see <a href="/example/ol-maplibre-style-layer">OpenLayers MaplibreStyle layer example</a>
 * @extends {MaplibreStyleLayer}
 */
class MocoLayer extends MaplibreStyleLayer {
  get date() {
    return this.get('date') || new Date();
  }

  set date(value: Date) {
    this.set('date', value);
    this.updateData();
  }

  get notifications() {
    return this.get('notifications') || undefined;
  }

  set notifications(value: MocoNotification[]) {
    this.set('notifications', value);
    this.updateData();
  }

  get tenant() {
    return this.get('tenant') || 'geopstest';
  }
  set tenant(value: string) {
    this.set('tenant', value);
    this.updateData();
  }

  #abortController: AbortController | null = null;

  #graphMapping: Record<number, string> = DEFAULT_GRAPH_MAPPING;

  constructor(options: MaplibreStyleLayerOptions) {
    super({
      ...options,
      layersFilter: ({ metadata }: LayerSpecification) => {
        return (
          (metadata as { 'rvf.filter': string })?.['rvf.filter'] ===
            MOCO_MD_LAYER_FILTER ||
          (metadata as { 'general.filter': string })?.['general.filter'] ===
            MOCO_MD_LAYER_FILTER
        );
      },
      maplibreLayer: options.maplibreLayer,
      sources: {
        [MOCO_SOURCE_ID]: {
          data: {
            features: [],
            type: 'FeatureCollection',
          },
          type: 'geojson',
        },
      },
    });
  }

  onLoad() {
    super.onLoad();
    console.log('MocoLayer: onLoad called');

    if (this.maplibreLayer?.mapLibreMap?.getLayer('moco_point')) {
      this.maplibreLayer?.mapLibreMap?.removeLayer('moco_point');
    }
    this.updateData();
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
    //console.log(`MocoLayer: Using graphs: ${graphsString}`);

    // We get the data from the MocoAPI
    const api = new MocoAPI({
      graph: graphsString,
      ssoConfig: this.tenant,
    });

    const date = this.date; // Example date, can be replaced with a dynamic date

    const notifications =
      this.notifications ||
      (await api.getNotifications(
        { date: date },
        { signal: this.#abortController.signal },
      ));

    const source = this.maplibreLayer?.mapLibreMap?.getSource(MOCO_SOURCE_ID);
    if (!source) {
      console.warn('MocoLayer: No source found for id : ', MOCO_SOURCE_ID);
      return;
    }

    const notifsToRender: MocoNotificationToRender[] = notifications
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

    console.log('Notifications data to display:', data);
    // Apply new data to the source
    (source as GeoJSONSource).setData(data);
  }
}

export default MocoLayer;
