import {
  getFeatureCollectionToRenderFromSituation,
  getGraphByZoom,
  MocoAPI,
} from '..';
import { DEFAULT_GRAPH_MAPPING } from '../utils/getGraphByZoom';

import MaplibreStyleLayer from './MaplibreStyleLayer';

import type {
  GeoJSONSource,
  LineLayerSpecification,
  SymbolLayerSpecification,
} from 'maplibre-gl';
import type { Map } from 'ol';

import type { MocoAPIOptions } from '../../api/MocoAPI';
import type { MapsStyleSpecification, StyleMetadataGraphs } from '../../types';
import type {
  ServiceConditionGroupEnumeration,
  SeverityGroupEnumeration,
  SituationType,
} from '../../types';

import type { MaplibreStyleLayerOptions } from './MaplibreStyleLayer';

export const MOCO_SOURCE_ID = 'moco';
export const MOCO_MD_LAYER_FILTER = 'moco';

export type MocoLayerOptions = {
  loadAll?: boolean;
  publicAt?: Date;
  situations?: Partial<SituationType>[];
  tenant?: string;
  url?: string;
} & MaplibreStyleLayerOptions &
  Pick<MocoAPIOptions, 'apiKey' | 'url'>;

export type MocoSituationToRender = {
  isAffected: boolean;
  isPublished: boolean;
} & Partial<SituationType>;

export interface MocoNotificationFeaturePropertiesToRender {
  geometry?: undefined; // to avoid ol problems
  graph: string;
  hasIcon?: boolean;
  id?: string; // The situation id
  isAffected: boolean;
  isPublished: boolean;
  reasonCategoryImageName: string;
  serviceConditionGroup: ServiceConditionGroupEnumeration;
  severityGroup: SeverityGroupEnumeration;
}

export type MocoNotificationFeatureToRender = GeoJSON.Feature<
  GeoJSON.LineString | GeoJSON.Point,
  MocoNotificationFeaturePropertiesToRender
>;

export type MocoNotificationFeatureCollectionToRender =
  GeoJSON.FeatureCollection<
    GeoJSON.LineString | GeoJSON.Point,
    MocoNotificationFeaturePropertiesToRender
  >;

export type MocoNotification = {
  properties: {
    graph: string;
    hasIcon?: boolean;
    isAffected: boolean;
    isPublished: boolean;
    reasonCategoryImageName: string;
    serviceConditionGroup: ServiceConditionGroupEnumeration;
    severityGroup: SeverityGroupEnumeration;
  } & Partial<SituationType>;
} & GeoJSON.FeatureCollection;

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
  get api(): MocoAPI {
    return this.get('api') as MocoAPI;
  }

  set api(value: MocoAPI) {
    this.set('api', value);
    void this.updateData();
  }

  get apiKey(): string | undefined {
    return this.api.apiKey;
  }

  set apiKey(value: string) {
    this.api.apiKey = value;
    void this.updateData();
  }

  get loadAll(): boolean {
    return (this.get('loadAll') as boolean) ?? true;
  }

  set loadAll(value: boolean) {
    this.set('loadAll', value);
    void this.updateData();
  }

  set publicAt(value: Date) {
    this.set('publicAt', value);
    void this.updateData();
  }

  get publicAt(): Date {
    return (this.get('publicAt') as Date) || new Date();
  }

  set situations(value: Partial<SituationType>[]) {
    this.set('situations', value);
    void this.updateData();
  }

  get situations(): Partial<SituationType>[] | undefined {
    return (
      (this.get('situations') as Partial<SituationType>[] | undefined) ||
      this.#situationsInternal
    );
  }

  get tenant(): string | undefined {
    return this.get('tenant') as string | undefined;
  }

  set tenant(value: string) {
    this.set('tenant', value);
    void this.updateData();
  }
  get url(): string | undefined {
    return this.api.url;
  }

  set url(value: string) {
    this.api.url = value;
    void this.updateData();
  }
  #abortController: AbortController | null = null;

  /**
   * This is used to store the notifications data that are rendered on the map and to filter them depending on the graph.
   */
  #dataInternal: MocoNotificationFeatureCollectionToRender = {
    features: [],
    type: 'FeatureCollection',
  };

  /** Graph mapping from the style metadata */
  #graphMapping?: StyleMetadataGraphs;

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
      api: new MocoAPI({
        apiKey: options.apiKey,
        // limit: 100,
        // onlyGWithGeom: true,
        tenant: options.tenant,
        url: options.url,
      }),
      layersFilter: ({
        metadata,
        source,
      }: LineLayerSpecification | SymbolLayerSpecification) => {
        return (
          (metadata as { 'general.filter': string })?.['general.filter'] ===
            MOCO_MD_LAYER_FILTER || source === MOCO_SOURCE_ID
        );
      },
      ...options,
    });
  }

  override attachToMap(map: Map) {
    super.attachToMap(map);

    // If the source is already there (no load event triggered) update data
    const source = this.maplibreLayer?.mapLibreMap?.getSource(MOCO_SOURCE_ID);
    if (source) {
      void this.updateData();
    }

    const mapInternal = this.getMapInternal();
    if (mapInternal) {
      this.olEventsKeys.push(
        mapInternal.on('moveend', () => {
          this.onZoomEnd();
        }),
      );
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

  getDataByGraph(
    data: MocoNotificationFeatureCollectionToRender,
  ): MocoNotificationFeatureCollectionToRender {
    const zoom = this.getMapInternal()?.getView()?.getZoom();
    const graphs = (
      this.maplibreLayer?.mapLibreMap?.getStyle() as MapsStyleSpecification
    ).metadata?.graphs;

    const graph = getGraphByZoom(zoom, graphs);
    const newData: MocoNotificationFeatureCollectionToRender = {
      features: (data?.features || []).filter((feature) => {
        return feature.properties?.graph === graph;
      }),
      type: 'FeatureCollection',
    };
    return newData;
  }

  onLoad() {
    super.onLoad();
    void this.updateData();
  }

  onZoomEnd() {
    const source: GeoJSONSource | undefined =
      this.maplibreLayer?.mapLibreMap?.getSource(MOCO_SOURCE_ID);
    if (!source || !this.#graphMapping || !this.#dataInternal.features.length) {
      return;
    }

    // We update the data if the graph has changed
    const newData = this.getDataByGraph(this.#dataInternal);
    if (newData !== this.#dataInternal) {
      source.setData(newData);
    }
  }

  async updateData() {
    if (this.#abortController) {
      this.#abortController.abort();
    }
    this.#abortController = new AbortController();

    // Get graphs mapping
    const mdGraphs = (
      this.maplibreLayer?.mapLibreMap?.getStyle() as MapsStyleSpecification
    ).metadata?.graphs;
    const graphMapping = mdGraphs ?? DEFAULT_GRAPH_MAPPING;
    const graphsString = [...new Set(Object.values(graphMapping))].join(',');

    const publicAt = this.publicAt;

    let situations = this.situations ?? [];

    if (!this.situations && this.loadAll) {
      const response = await this.api
        .export(
          {
            graph: graphsString,
            hasGeoms: true,
            publicAt: publicAt.toISOString(),
          },
          { signal: this.#abortController.signal },
        )
        .catch((error) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
          if (/AbortError/.test(error?.name)) {
            // Ignore abort error
            return { paginatedSituations: { results: [] as SituationType[] } };
          }
          throw error;
        });
      situations = response.paginatedSituations.results || [];
    }
    this.#situationsInternal = situations;

    const source = this.maplibreLayer?.mapLibreMap?.getSource(MOCO_SOURCE_ID);
    if (!source) {
      // eslint-disable-next-line no-console
      console.warn('MocoLayer: No source found for id : ', MOCO_SOURCE_ID);
      return;
    }

    const data = {
      features: situations.flatMap((situation) => {
        return getFeatureCollectionToRenderFromSituation(situation).features;
      }),
      type: 'FeatureCollection',
    } as MocoNotificationFeatureCollectionToRender;
    this.#dataInternal = data;

    // Apply new data to the source
    (source as GeoJSONSource).setData(this.getDataByGraph(data));

    this.#graphMapping = graphMapping; // Active update of data on zoom end

    return true;
  }
}

export default MocoLayer;
