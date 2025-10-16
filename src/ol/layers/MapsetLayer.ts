import VectorLayer from 'ol/layer/Vector';
import { unByKey } from 'ol/Observable';
import { transformExtent } from 'ol/proj';
import { Vector } from 'ol/source';

import MapsetAPI from '../../api/MapsetApi';
import MapsetKmlFormat from '../utils/MapsetKmlFormat';

import type { Map } from 'ol';
import type { EventsKey } from 'ol/events';
import type { FeatureLike } from 'ol/Feature';
import type { Options } from 'ol/layer/Vector';

import type { MapsetPlan } from '../../api/MapsetApi';
import type { MapsetAPIOptions } from '../../api/MapsetApi';

import type { MobilityLayerOptions } from './Layer';

export type MapsetLayerOptions = {
  api?: MapsetAPI;
  doNotRevert32pxScaling?: boolean;
  loadAll?: boolean;
  planId?: string;
} & MapsetAPIOptions &
  MobilityLayerOptions &
  Options;

const kmlFormatter = new MapsetKmlFormat();

/**
 * An OpenLayers layer able to display plan data from [mapset](https://geops.com/de/solution/mapset).
 *
 * @example
 * import { MapsetLayer } from 'mobility-toolbox-js/ol';
 *
 * const layer = new MapsetLayer({
 *   apiKey: 'yourApiKey',
 *   // tags: ['test'],
 *   // tenants: ['geopstest'],
 *   // url: 'https://editor.mapset.io/api/v1',
 * });
 *
 * @see <a href="/doc/class/build/api/MapsetApi%20js~MapsetAPI%20html-offset-anchor">MapsetAPI</a>
 * @see <a href="/example/ol-mapset-layer">OpenLayers Mapset layer example</a>
 *
 *
 * @extends {ol/layer/VectorLayer~VectorLayer}
 *
 * @public
 */

class MapsetLayer extends VectorLayer<Vector<FeatureLike>> {
  loadAll = true;
  olEventsKeys: EventsKey[] = [];

  get api(): MapsetAPI {
    return this.get('api') as MapsetAPI;
  }
  set api(value: MapsetAPI) {
    this.set('api', value);
    void this.fetchPlans();
  }

  get apiKey(): string {
    return this.get('apiKey') as string;
  }
  set apiKey(value: string) {
    if (this.apiKey !== value) {
      this.set('apiKey', value);
      void this.fetchPlans();
    }
  }

  get doNotRevert32pxScaling(): boolean {
    return this.get('doNotRevert32pxScaling') as boolean;
  }

  set doNotRevert32pxScaling(value: boolean) {
    this.set('doNotRevert32pxScaling', value);
    this.updateFeatures();
  }

  get planId(): string | undefined {
    return this.get('planId') as string | undefined;
  }
  set planId(value: string | undefined) {
    if (this.planId !== value) {
      this.set('planId', value);
      void this.fetchPlanById(value);
    }
  }

  get plans(): MapsetPlan[] {
    return this.get('plans') as MapsetPlan[];
  }
  set plans(value: MapsetPlan[]) {
    this.set('plans', value);
    this.updateFeatures();
  }

  get tags(): string[] {
    return this.get('tags') as string[];
  }
  set tags(value: string[]) {
    if (this.tags?.toString() !== value?.toString()) {
      this.set('tags', value);
      void this.fetchPlans();
    }
  }

  get tenants(): string[] {
    return this.get('tenants') as string[];
  }
  set tenants(value: string[]) {
    if (this.tenants?.toString() !== value?.toString()) {
      this.set('tenants', value);
      void this.fetchPlans();
    }
  }

  get timestamp(): string | undefined {
    return this.get('timestamp') as string | undefined;
  }
  set timestamp(value: string | undefined) {
    if (this.timestamp !== value) {
      this.set('timestamp', value);
      void this.fetchPlans();
    }
  }

  get url(): string {
    return this.api?.url;
  }
  set url(value: string) {
    if (this.api && this.api?.url !== value) {
      this.api.url = value;
      void this.fetchPlans();
    }
  }

  #abortController: AbortController;

  /**
   * Constructor.
   *
   * @param {Object} options
   * @param {string} options.apiKey Access key for [geOps APIs](https://developer.geops.io/).
   * @param {string[]} [options.tags] The tags of the required plans.
   * @param {string} [options.timestamp] The timestamp of the required plans.
   * @param {string[]} [options.tenants] The tenants of the required plans.
   * @param {string} [options.url] The URL of the [geOps Mapset API](https://geops.com/de/solution/mapset).
   * @public
   */
  constructor(options: MapsetLayerOptions = {}) {
    super({
      source: options.source ?? new Vector<FeatureLike>(),
      ...options,
    });
    this.api =
      options.api ??
      new MapsetAPI({
        apiKey: options.apiKey ?? '',
        url: options.url ?? 'https://editor.mapset.io/api/v1',
      });
    this.#abortController = new AbortController();

    if (options.loadAll === false) {
      this.loadAll = options.loadAll;
    }
  }

  async fetchPlanById(planId?: string) {
    this.#abortController?.abort();
    this.#abortController = new AbortController();

    if (!planId) {
      this.plans = [];
      return;
    }
    let planById: MapsetPlan;
    try {
      planById = await this.api.getPlanById(planId, {
        signal: this.#abortController.signal,
      });
      this.plans = [planById];
    } catch (e) {
      // @ts-expect-error Abort errors are OK
      if ((e?.name as string).includes('AbortError')) {
        // Ignore abort error
        return;
      }
      // eslint-disable-next-line no-console
      console.error('MapsetLayer: Error fetching plan by ID...', e);
      this.plans = [];
      throw e;
    }
    return;
  }

  async fetchPlans() {
    if (!this.getVisible()) {
      return;
    }
    const view = this.getMapInternal()?.getView();
    if (!view) {
      return;
    }
    const extent = transformExtent(
      view.calculateExtent(),
      view.getProjection(),
      'EPSG:4326',
    );
    const zoom = view.getZoom();

    if (!zoom || !extent) {
      this.plans = [];
      return;
    }

    this.#abortController?.abort();
    this.#abortController = new AbortController();

    let plans: MapsetPlan[] = [];
    try {
      plans = await this.api.getPlans(
        {
          bbox: extent?.toString(),
          key: this.apiKey,
          tags: this.tags?.toString(),
          tenants: this.tenants?.toString(),
          timestamp: this.timestamp,
          zoom,
        },
        { signal: this.#abortController.signal },
      );
    } catch (e) {
      // @ts-expect-error Abort errors are OK
      if ((e?.name as string).includes('AbortError')) {
        // Ignore abort error
        return [];
      }
      console.error('MapsetLayer: Error fetching plans...', e);
      throw e;
    }

    this.plans = plans;
  }

  setMapInternal(map: Map): void {
    super.setMapInternal(map);

    if (map && this.loadAll) {
      void this.fetchPlans();
      this.olEventsKeys.push(
        map.on('moveend', () => {
          void this.fetchPlans();
        }),
        this.on('change:visible', () => {
          void this.fetchPlans();
        }),
      );
    } else {
      unByKey(this.olEventsKeys);
    }

    if (map && this.planId) {
      void this.fetchPlanById(this.planId);
    }
  }

  public updateFeatures() {
    this.getSource()?.clear();
    const map = this.getMapInternal();

    if (map && this.plans?.length !== 0) {
      const features =
        this.plans?.flatMap((plan) => {
          return kmlFormatter.readFeatures(
            plan.data,
            map.getView().getProjection(),
            this.doNotRevert32pxScaling,
          );
        }) ?? [];

      this.getSource()?.addFeatures(features);
    }

    this.dispatchEvent('updatefeatures');
  }
}

export default MapsetLayer;
