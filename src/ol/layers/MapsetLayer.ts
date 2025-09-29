import VectorLayer from 'ol/layer/Vector';
import { toLonLat } from 'ol/proj';
import { Vector } from 'ol/source';

import MapsetAPI from '../../api/MapsetApi';
import MapsetKmlFormat from '../utils/MapsetKmlFormat';

import type { Map } from 'ol';
import type { FeatureLike } from 'ol/Feature';
import type { Options } from 'ol/layer/Vector';

import type { MapsetPlan } from '../../api/MapsetApi';
import type { MapsetAPIOptions } from '../../api/MapsetApi';

import type { MobilityLayerOptions } from './Layer';

export type MapsetLayerOptions = {
  api?: MapsetAPI;
  doNotRevert32pxScaling?: boolean;
  planId?: string;
} & MapsetAPIOptions &
  MobilityLayerOptions &
  Options;

const kmlFormatter = new MapsetKmlFormat();

class MapsetLayer extends VectorLayer<Vector<FeatureLike>> {
  get api(): MapsetAPI {
    return this.get('api') as MapsetAPI;
  }
  set api(value: MapsetAPI) {
    this.set('api', value);
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

  get bbox(): null | number[] {
    return this.get('bbox') as null | number[];
  }
  set bbox(value: null | number[]) {
    if (this.bbox?.toString() !== value?.toString()) {
      this.set('bbox', value);
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
      void this.fetchPlans(value);
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
    return this.get('url') as string;
  }
  set url(value: string) {
    if (this.url !== value) {
      this.set('url', value);
      void this.fetchPlans();
    }
  }

  get zoom(): number {
    return this.get('zoom') as number;
  }
  set zoom(value: number) {
    if (this.zoom !== value) {
      this.set('zoom', value);
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
   * @param {number[]} [options.bbox] The bounding box to search within.
   * @param {string} [options.timestamp] The timestamp of the required plans.
   * @param {string[]} [options.tenants] The tenants of the required plans.
   * @param {string} [options.url] The URL of the [geOps Mapset API](https://geops.com/de/solution/mapset).
   * @param {number} [options.zoom=1] The zoom level to search within.
   * @param {boolean} [options.doNotRevert32pxScaling=false] Do not revert the 32px scaling of the icons.
   * @param {MapsetAPI} [options.api] The Mapset API instance to use.
   * @param {string} [options.planId] The ID of the Mapset plan to load.
   * @param {MapsetPlan[]} [options.plans] The ID of the Mapset plan to load. Ignored if `planId` is set.
   * @public
   */
  constructor(options: MapsetLayerOptions = {}) {
    super({
      source: options.source ?? new Vector<FeatureLike>(),
      url: options.url ?? 'https://editor.mapset.io/api/v1',
      zoom: options.zoom ?? 6,
      ...options,
    });
    this.api =
      options.api ??
      new MapsetAPI({
        apiKey: options.apiKey,
        bbox: options.bbox,
        tags: options.tags,
        tenants: options.tenants,
        timestamp: options.timestamp,
        url: this.url,
        zoom: options.zoom,
      });
    this.#abortController = new AbortController();
  }

  public async fetchPlans(planId?: string) {
    this.#abortController?.abort();
    this.#abortController = new AbortController();

    if (planId) {
      let planById: MapsetPlan;
      try {
        planById = await this.api.getPlanById(planId, {
          signal: this.#abortController.signal,
        });
      } catch (e) {
        // @ts-expect-error Abort errors are OK
        if ((e?.name as string).includes('AbortError')) {
          // Ignore abort error
          return;
        }
        console.error('MapsetLayer: Error fetching plan by ID...', e);
        throw e;
      }
      this.plans = [planById];
      return;
    }

    let plans: MapsetPlan[] = [];
    this.api = new MapsetAPI({
      apiKey: this.apiKey,
      bbox:
        (this.bbox && [
          ...toLonLat([this.bbox[0], this.bbox[1]]),
          ...toLonLat([this.bbox[2], this.bbox[3]]),
        ]) ??
        undefined,
      tags: this.tags || [],
      tenants: this.tenants || [],
      timestamp: this.timestamp,
      url: this.url,
      zoom: this.zoom ?? 6,
    });

    try {
      plans = await this.api.getPlans(
        {},
        { signal: this.#abortController.signal },
      );
    } catch (e) {
      // @ts-expect-error Abort errors are OK
      if ((e?.name as string).includes('AbortError')) {
        // Ignore abort error
        return;
      }
      console.error('MapsetLayer: Error fetching plans...', e);
      throw e;
    }

    this.plans = plans;
  }

  setMapInternal(map: Map | null): void {
    super.setMapInternal(map);
    if (this.planId) {
      void this.fetchPlans(this.planId);
      return;
    }
    if (this.plans) {
      void this.fetchPlans();
      return;
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
