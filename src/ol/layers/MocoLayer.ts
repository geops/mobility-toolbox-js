import { GeoJSONSource } from 'maplibre-gl';

import {
  getMocoIconRefFeatures,
  getMocoNotificationsAsFeatureCollection,
  isMocoNotificationActive,
  isMocoNotificationPublished,
  MocoAPI,
} from '..';
import { MocoNotification } from '../../types';
import MaplibreStyleLayer, {
  MaplibreStyleLayerOptions,
} from './MaplibreStyleLayer';

export const MOCO_SOURCE_ID = 'rvf_moco';
export const MOCO_MD_LAYER_FILTER = 'notifications';
export const DEFAULT_GRAPH_MAPPING = { 1: 'osm' };

export type MocoLayerOptions = {
  date?: Date;
  notifications: MocoNotification[];
  tenant?: string;
} & MaplibreStyleLayerOptions;

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
 * @extends {ol/layer/Layer~Layer}
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
      layers: [
        // Display line
        {
          filter: [
            'all',
            ['==', '$type', 'LineString'],
            ['==', 'isActive', true],
          ],
          id: 'moco-notification-line',
          layout: {
            'line-cap': 'round',
            'line-join': 'round',
          },
          paint: {
            'line-color': ['get', 'line-color'],
            'line-width': ['get', 'line-width'],
          },
          source: MOCO_SOURCE_ID,
          type: 'line',
        },
        // Display an icon
        {
          filter: [
            'all',
            ['==', '$type', 'Point'],
            ['==', 'isIconRefPoint', true],
            ['==', 'isPublished', true],
          ],
          id: 'moco-notification-icon',
          layout: {
            // 'icon-allow-overlap': true,
            'icon-image': ['get', 'icon-image'],
            'text-anchor': 'left',
            // 'text-field': ['get', 'text-field'],
            'text-font': ['SourceSansPro-Bold'],
            'text-justify': 'auto',
            'text-radial-offset': 1,
            'text-size': 14,

            // "icon-size": ["interpolate", ["linear"], ["zoom"], 11, 0, 11, 0.6],
            visibility: 'visible',
          },
          minzoom: 11,
          paint: {
            'icon-halo-blur': 0,
            'icon-halo-color': 'rgba(255, 255, 255, 0)',
            'icon-halo-width': 0,
            'icon-opacity': 1,
            'text-color': '#000000',
            'text-halo-blur': 1,
            'text-halo-color': 'rgba(255, 255, 255, 1)',
            'text-halo-width': 3,
          },

          source: MOCO_SOURCE_ID,
          type: 'symbol',
        },

        // Display a banner with the start date
        // {
        //   filter: [
        //     'all',
        //     ['==', ['get', 'isIconRefPoint'], true],
        //     ['==', ['get', 'isActive'], false],
        //     ['==', ['get', 'isPublished'], true],
        //   ],
        //   id: 'notificationsIconRefPointNonActive',
        //   layout: {
        //     'icon-allow-overlap': true,
        //     // "icon-image": "warningBanner",
        //     'icon-image': [
        //       'coalesce',
        //       // ["image", "warning"],
        //       ['image', ['get', 'disruption_type_banner']],
        //       // If no image with the name above exists, show the
        //       // "rocket" image instead.
        //       ['image', 'warningBanner'],
        //     ],
        //     'icon-size': 0.15,
        //     // "icon-size": ["interpolate", ["linear"], ["zoom"], 11, 0, 11, 0.15],
        //     'text-field': ['get', 'starts'],
        //     'text-offset': [1.5, 0],
        //     'text-size': 8,
        //     visibility: 'visible',
        //   },
        //   metadata: {
        //     'general.filter': 'notifications',
        //   },
        //   minzoom: 11,
        //   paint: {},
        //   source: MOCO_SOURCE_ID,
        //   type: 'symbol',
        // },
      ],
      // layersFilter: ({ metadata }: LayerSpecification) => {
      //   return (
      //     (metadata as { 'general.filter': string })?.['general.filter'] ===
      //     MOCO_MD_LAYER_FILTER
      //   );
      // },
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

    notifications.forEach((notification) => {
      // Add status properties to the features, these properties are only there for rendering purposes
      (
        notification.properties as {
          isPublished?: boolean;
        } & typeof notification.properties
      ).isPublished = isMocoNotificationPublished(
        notification.properties,
        date,
      );

      (
        notification.properties as {
          isActive?: boolean;
        } & typeof notification.properties
      ).isActive = isMocoNotificationActive(notification.properties, date);

      // if (
      //   notification.properties.isPublished &&
      //   !notification.properties.isActive
      // ) {
      //   (
      //     notification.properties as {
      //       'text-field'?: string;
      //     } & typeof notification.properties
      //   )['text-field'] = getMocoStartsString(notification.properties, date);
      // }
    });

    // Transform to a usable format for MapLibre
    const notifsToDisplay = notifications.filter((n) => {
      return n.properties.isPublished || n.properties.isActive;
    });

    notifsToDisplay.forEach((notification) => {
      // Add icon ref features, these features are only there for rendering purposes
      const iconRefFeatures = getMocoIconRefFeatures(notification);
      notification.features.push(...iconRefFeatures);
    });

    const data = getMocoNotificationsAsFeatureCollection(notifsToDisplay);

    console.log('Notifications data to display:', data);
    // Apply new data to the source
    (source as GeoJSONSource).setData(data);
  }
}

export default MocoLayer;
