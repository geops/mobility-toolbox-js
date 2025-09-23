import VectorLayer from 'ol/layer/Vector';
import { toLonLat } from 'ol/proj';
import { Vector } from 'ol/source';

import MapsetAPI from '../../api/MapsetApi';
import MapsetKmlFormat from '../utils/MapsetKmlFormat';

import type { FeatureLike } from 'ol/Feature';
import type { Options } from 'ol/layer/Vector';

import type { MapsetAPIOptions } from '../../api/MapsetApi';
import type { MapsetPlan } from '../../types';

import type { MobilityLayerOptions } from './Layer';

type MapsetLayerOptions = {
  doNotRevert32pxScaling?: boolean;
} & MapsetAPIOptions &
  MobilityLayerOptions &
  Options;

const kmlFormatter = new MapsetKmlFormat();

class MapsetLayer extends VectorLayer<Vector<FeatureLike>> {
  api?: MapsetAPI;
  get apiKey(): string {
    return this.get('apiKey') as string;
  }
  set apiKey(value: string) {
    if (this.apiKey !== value) {
      this.set('apiKey', value);
      void this.updateData();
    }
  }

  get bbox(): null | number[] {
    return this.get('bbox') as null | number[];
  }
  set bbox(value: null | number[]) {
    if (ths.bbox?.toString() !== value?.toString()) {
      this.set('bbox', value);
      void this.updateData();
    }
  }

  get doNotRevert32pxScaling(): boolean {
    return this.get('doNotRevert32pxScaling') as boolean;
  }
  set doNotRevert32pxScaling(value: boolean) {
    this.set('doNotRevert32pxScaling', value);
    this.loadPlans();
  }

  get plans(): MapsetPlan[] {
    return this.get('plans') as MapsetPlan[];
  }
  set plans(value: MapsetPlan[]) {
    this.set('plans', value);
    this.loadPlans();
  }

  get tags(): string[] {
    return this.get('tags') as string[];
  }
  set tags(value: string[]) {
    const current = this.tags || [];
    const changed =
      current.length !== value.length ||
      current.some((tag, i) => {
        return tag.toString() !== value[i]?.toString();
      });
    if (changed) {
      this.set('tags', value);
      void this.updateData();
    }
  }

  get tenants(): string[] {
    return this.get('tenants') as string[];
  }
  set tenants(value: string[]) {
    const current = this.tenants || [];
    const changed =
      current.length !== value.length ||
      current.some((tenant, i) => {
        return tenant.toString() !== value[i]?.toString();
      });
    if (changed) {
      this.set('tenants', value);
      void this.updateData();
    }
  }

  get timestamp(): string | undefined {
    return this.get('timestamp') as string | undefined;
  }
  set timestamp(value: string | undefined) {
    if (this.timestamp !== value) {
      this.set('timestamp', value);
      void this.updateData();
    }
  }

  get url(): string {
    return this.get('url') as string;
  }
  set url(value: string) {
    if (this.url !== value) {
      this.set('url', value);
      void this.updateData();
    }
  }

  #abortController: AbortController;

  constructor(options: MapsetLayerOptions = {}) {
    super({ ...options, source: new Vector<FeatureLike>() });
    this.url = options.url ?? 'https://editor.dev.mapset.io/api/v1';
    this.#abortController = new AbortController();
  }

  public loadPlans() {
    this.getSource()?.clear();
    const map = this.getMapInternal();

    if (!this.plans || this.plans?.length === 0 || !map) {
      return;
    }

    this.plans?.forEach((plan) => {
      const features = kmlFormatter.readFeatures(
        plan.data,
        map.getView().getProjection(),
        this.doNotRevert32pxScaling,
      );
      this.getSource()?.addFeatures(features || []);
    });

    this.dispatchEvent('load:plans');
  }

  public async updateData() {
    const map = this.getMapInternal();
    if (!map || !this.get('url') || !map.getView()) {
      console.warn(
        'MapsetLayer: map, view or url not set, cannot fetch plans',
        {
          map: map,
          url: this.get('url') as string,
          view: map?.getView(),
        },
      );
      return;
    }

    this.#abortController.abort();
    this.#abortController = new AbortController();

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
      zoom: Math.floor(map.getView().getZoom() ?? 1),
    });

    let plans: MapsetPlan[] = [];

    try {
      plans = await this.api.getPlans(
        {},
        { signal: this.#abortController.signal },
      );
    } catch (e) {
      // @ts-expect-error Abort errors are OK
      // eslint-disable-next-line
      if (/AbortError/.test(e?.name)) {
        // Ignore abort error
        return;
      }
      console.error('MapsetLayer: Error fetching plans...', e);
      throw e;
    }

    this.plans = plans;
  }
}

export default MapsetLayer;
