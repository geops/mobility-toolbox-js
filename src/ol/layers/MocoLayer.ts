import {
  getFeatureCollectionToRenderFromSituation,
  getGraphByZoom,
  MocoAPI,
} from "..";
import getGraphByZoomFromStyleMetadata, {
  DEFAULT_GRAPH,
  DEFAULT_GRAPH_MAPPING,
} from "../utils/getGraphByZoomFromStyleMetadata";

import MaplibreStyleLayer from "./MaplibreStyleLayer";

import type {
  GeoJSONSource,
  LayerSpecification,
  LineLayerSpecification,
  SymbolLayerSpecification,
} from "maplibre-gl";
import type { Map } from "ol";
import type { Layer } from "ol/layer";
import type BaseLayer from "ol/layer/Base";

import type { MocoAPIOptions } from "../../api/MocoAPI";
import type { Moco } from "../../types";
import type { MapsStyleSpecification } from "../../types";

import type { MaplibreStyleLayerOptions } from "./MaplibreStyleLayer";

export const MOCO_SOURCE_ID = "moco";
export const MAPS_MD_GENERAL_FILTER = "general.filter";
export const MOCO_MD_LAYER_FILTER = "moco";
export const MOCO_MD_LAYER_FILTER_LNP = `${MOCO_MD_LAYER_FILTER}.lnp`;

const getMocoLayersFilter = (lnpLayer?: BaseLayer) => {
  const visible = lnpLayer?.getVisible() ?? false;
  let mdValue = MOCO_MD_LAYER_FILTER;
  if (visible) {
    mdValue += MOCO_MD_LAYER_FILTER_LNP;
  }
  return (layerSpec: LayerSpecification) => {
    const metadata = layerSpec.metadata as Record<string, string> | undefined;
    const source = (
      layerSpec as LineLayerSpecification | SymbolLayerSpecification
    ).source;
    return (
      metadata?.[MAPS_MD_GENERAL_FILTER] === mdValue ||
      source === MOCO_SOURCE_ID
    );
  };
};

export type MocoLayerOptions = {
  apiParameters?: Moco.ExportParameters;
  /**
   * TODO: Not used right now. But will be in the future.
   * @experimental
   */
  generalizationLevelByZoom?: string[];
  graphByZoom?: string[];
  /**
   * This options is here to faciliate the use of Moco layer in combination mit LNP daten,
   * for example it uses different graph depending on the visibility of an LNP layer.
   * You can also obtain the same behavior using application code, just do not set the layer
   * if you want to do so.
   * @experimental
   */
  lnpLayer?: BaseLayer;
  loadAll?: boolean;
  loadByZoom?: boolean;
  publicAt?: Date;
  situations?: Partial<Moco.SituationType>[];
  tenant?: string;
  url?: string;
  useGraphsFromStyle?: boolean;
} & MaplibreStyleLayerOptions &
  Pick<MocoAPIOptions, "apiKey" | "tenant" | "url">;

export interface MocoNotificationStopPropertiesToRender {
  name?: string;
  publicationStopId?: Moco.PublicationStopType["id"];
}

export interface MocoNotificationLinePropertiesToRender {
  hasIcon?: Moco.PublicationLineGroupType["hasIcon"];
  line?: Moco.LineType;
  mot?: Moco.PublicationLineGroupType["mot"];
  name?: string;
}
export interface MocoNotificationSituationPropertiesToRender {
  publicationId?: Moco.PublicationType["id"];
  situationId?: Moco.SituationType["id"];
}

/**
 * This type contains the properties used by the style to render the situation.
 * The extended properties are there to avoid having to request the API again when
 * displaying details for this feature.
 */
export type MocoNotificationFeaturePropertiesToRender = {
  geometry?: undefined; // to avoid ol problems
  graph: string;
  isAffected: boolean;
  isPublished: boolean;
  reasonCategoryImageName: string;
  reasons?: Moco.ReasonType[];
  serviceCondition: Moco.ServiceConditionEnumeration;
  serviceConditionGroup: Moco.ServiceConditionGroupEnumeration;
  severity: Moco.SeverityEnumeration;
  severityGroup: Moco.SeverityGroupEnumeration;
} & (
  | MocoNotificationLinePropertiesToRender
  | MocoNotificationStopPropertiesToRender
) &
  MocoNotificationSituationPropertiesToRender;

export type MocoNotificationFeatureToRender = GeoJSON.Feature<
  GeoJSON.LineString | GeoJSON.Point,
  MocoNotificationFeaturePropertiesToRender
>;

export type MocoNotificationFeatureCollectionToRender =
  GeoJSON.FeatureCollection<
    GeoJSON.LineString | GeoJSON.Point,
    MocoNotificationFeaturePropertiesToRender
  >;

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
 *   // publicAt: new Date(),
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
    return this.get("api") as MocoAPI;
  }

  set api(value: MocoAPI) {
    this.set("api", value);
    void this.updateData();
  }

  get apiKey(): string | undefined {
    return this.api.apiKey;
  }

  set apiKey(value: string) {
    this.api.apiKey = value;
    void this.updateData();
  }

  get apiParameters(): Moco.ExportParameters | undefined {
    return this.get("apiParameters") as Moco.ExportParameters | undefined;
  }

  set apiParameters(value: Moco.ExportParameters) {
    this.set("apiParameters", value);
    void this.updateData();
  }

  get generalizationLevelByZoom() {
    return (this.get("generalizationLevelByZoom") as string[]) ?? [];
  }

  set generalizationLevelByZoom(generalizationLevelByZoom: string[]) {
    this.set("generalizationLevelByZoom", generalizationLevelByZoom);
    void this.updateData();
  }

  get graphByZoom(): null | string[] | undefined {
    return this.get("graphByZoom") as null | string[] | undefined;
  }

  set graphByZoom(graphByZoom: null | string[] | undefined) {
    this.set("graphByZoom", graphByZoom);
    void this.updateData();
  }

  get lnpLayer(): Layer | undefined {
    return this.get("lnpLayer") as Layer | undefined;
  }

  get loadAll(): boolean {
    return (this.get("loadAll") as boolean) ?? true;
  }

  set loadAll(value: boolean) {
    this.set("loadAll", value);
    void this.updateData();
  }

  get loadByZoom(): boolean {
    return (this.get("loadByZoom") as boolean) ?? false;
  }

  set loadByZoom(value: boolean) {
    this.set("loadByZoom", value);
    void this.updateData();
  }

  set publicAt(value: Date) {
    this.set("publicAt", value);
    void this.updateData();
  }
  get publicAt(): Date {
    return this.get("publicAt") as Date;
  }

  set situations(value: Partial<Moco.SituationType>[]) {
    // If we set situations we do not want to load data from backend
    this.loadAll = false;
    this.set("situations", value);
    void this.updateData();
  }

  get situations(): Partial<Moco.SituationType>[] | undefined {
    return this.get("situations") as Partial<Moco.SituationType>[] | undefined;
  }

  get tenant(): string | undefined {
    return this.get("tenant") as string | undefined;
  }

  set tenant(value: string) {
    this.set("tenant", value);
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
    type: "FeatureCollection",
  };

  /**
   * Cache the request responses when loadByZoom is true
   */
  #fetchCache: Record<string, Moco.SituationType[]> = {};

  /**
   * Constructor.
   *
   * @param {Object} options
   * @param {string} options.apiKey Access key for [geOps APIs](https://developer.geops.io/).
   * @param {string} [options.apiParameters] The url parameters to be included in the MOCO API request.
   * @param {boolean} [options.loadAll=true] If true, all active and published notifications will be loaded at once, otherwise only the notifications set in 'notifications' will be displayed.
   * @param {boolean} [options.loadByZoom=false] If true, notifications will be loaded based on the current zoom level. Use this option only if you see performance issues with loadAll.
   * @param {boolean} [options.useGraphs=false] If true, only the notifications using the current graphs for the current zoom level will be passed to the maplibre source.
   * @param {MocoNotification[]} [options.notifications] The notifications to display. If not set and loadAll is true, all active and published notifications will be loaded.
   * @param {string} [options.publicAt] The date to filter notifications. If not set, the current date is used.
   * @param {string} [options.tenant] The SSO config to use to get notifications from.
   * @param {string} [options.url] The URL of the [geOps MOCO API](https://geops.com/de/solution/disruption-information).
   * @public
   */
  constructor(options: MocoLayerOptions) {
    super({
      api: new MocoAPI({
        apiKey: options.apiKey,
        tenant: options.tenant,
        url: options.url,
      }),
      layersFilter: getMocoLayersFilter(options.lnpLayer),
      ...options,
    });
  }
  override attachToMap(map: Map) {
    super.attachToMap(map);

    // If the source is already there (no load event triggered), we update data
    const source = this.maplibreLayer?.mapLibreMap?.getSource(MOCO_SOURCE_ID);
    if (source) {
      void this.updateData();
    }
    const mapInternal = this.getMapInternal();

    if (mapInternal && this.loadByZoom) {
      this.olEventsKeys.push(
        mapInternal.on("moveend", () => {
          if (this.loadByZoom) {
            void this.updateData();
          }
        }),
      );
    }
    if (this.lnpLayer) {
      if (!this.layersFilter) {
        this.layersFilter = getMocoLayersFilter(this.lnpLayer);
      }
      this.olEventsKeys.push(
        this.lnpLayer.on("change:visible", () => {
          this.layersFilter = getMocoLayersFilter(this.lnpLayer);

          if (this.loadByZoom) {
            void this.updateData();
          }
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
        type: "FeatureCollection",
      });
    }

    if (this.#abortController) {
      this.#abortController.abort();
      this.#abortController = null;
    }
  }

  async fetchData(
    params: Partial<Moco.ExportParameters>,
    config: RequestInit = {},
  ): Promise<Moco.SituationType[] | undefined> {
    const requestParameters = {
      hasGeoms: true,
      publicAt: this.publicAt?.toISOString(),
      publicNow: !this.publicAt, // publicNow use a backend caching optimization
      ...(this.apiParameters ?? {}),
      ...params,
    };

    // Cache the request response for one minute to avoid too much requests on the backend
    let cacheKey: string | undefined;
    try {
      cacheKey = JSON.stringify({
        config,
        requestParameters,
        time: Math.floor(Date.now() / 60000),
      });
      if (this.#fetchCache[cacheKey]) {
        return this.#fetchCache[cacheKey];
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn("Error stringifying fetch parameters for caching", error);
    }

    try {
      const response = await this.api.export(requestParameters, config);
      if (response?.paginatedSituations?.results && cacheKey) {
        this.#fetchCache[cacheKey] = response.paginatedSituations.results;
      }
      return response.paginatedSituations.results;
    } catch (error) {
      if (error && (error as { name: string }).name.includes("AbortError")) {
        // Ignore abort error
        return [];
      }
      throw error;
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
      type: "FeatureCollection",
    };
    return newData;
  }

  /**
   * This functions load situations from backend depending on the current graph mapping in the style metadata.
   * @returns
   */
  async loadData(): Promise<Moco.SituationType[] | undefined> {
    if (this.#abortController) {
      this.#abortController.abort();
    }
    this.#abortController = new AbortController();

    let graphs = [DEFAULT_GRAPH];

    if (this.graphByZoom) {
      graphs = this.graphByZoom;
    } else if (!this.lnpLayer || this.lnpLayer.getVisible()) {
      // if no graphByzoom defined we use the ones from the style metadata
      // Get graphs mapping
      const mdGraphs = (
        this.maplibreLayer?.mapLibreMap?.getStyle() as MapsStyleSpecification
      ).metadata?.graphs;
      const graphMapping = mdGraphs ?? DEFAULT_GRAPH_MAPPING;
      graphs = Object.values(graphMapping);
    }

    const graphsString = [...new Set(graphs)].join(",");
    return this.fetchData(
      { graph: graphsString },
      { signal: this.#abortController.signal },
    );
  }

  /**
   * This functions load situations from backend depending on the current graph mapping in the style metadata.
   * @returns
   */
  async loadDataByZoom(): Promise<Moco.SituationType[] | undefined> {
    if (this.#abortController) {
      this.#abortController.abort();
    }
    this.#abortController = new AbortController();

    const zoom = this.getMapInternal()?.getView()?.getZoom();
    let graphsString = DEFAULT_GRAPH;
    if (this.graphByZoom) {
      graphsString = getGraphByZoom(zoom, this.graphByZoom);
    } else if (!this.lnpLayer || this.lnpLayer.getVisible()) {
      // if no graphByzoom defined we use the ones from the style metadata
      const mdGraphs = (
        this.maplibreLayer?.mapLibreMap?.getStyle() as MapsStyleSpecification
      ).metadata?.graphs;
      graphsString = getGraphByZoomFromStyleMetadata(zoom, mdGraphs);
    }

    return this.fetchData(
      { graph: graphsString },
      { signal: this.#abortController.signal },
    );
  }

  onLoad() {
    super.onLoad();
    void this.updateData();
  }

  /**
   * This function updates the GeoJSON source data, with the current situations available in this.situations.
   * @returns
   */
  async updateData(): Promise<boolean | undefined> {
    if (this.loadByZoom) {
      const situations = await this.loadDataByZoom();
      // We don't use the setter here to avoid infinite loop
      this.set("situations", situations ?? []);
    } else if (this.loadAll) {
      const situations = await this.loadData();
      // We don't use the setter here to avoid infinite loop
      this.set("situations", situations ?? []);
    }
    const source: GeoJSONSource | undefined =
      this.maplibreLayer?.mapLibreMap?.getSource(MOCO_SOURCE_ID);
    if (!source) {
      // eslint-disable-next-line no-console
      console.warn("MocoLayer: No source found for id : ", MOCO_SOURCE_ID);
      return Promise.reject(new Error("No source found"));
    }

    const data = {
      features: (this.situations ?? []).flatMap((situation) => {
        return getFeatureCollectionToRenderFromSituation(
          situation,
          this.publicAt,
        ).features;
      }),
      type: "FeatureCollection",
    } as MocoNotificationFeatureCollectionToRender;

    this.#dataInternal = data;

    source.setData(this.#dataInternal);
    return Promise.resolve(true);
  }
}

export default MocoLayer;
