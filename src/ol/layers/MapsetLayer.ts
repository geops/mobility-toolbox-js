import VectorLayer from 'ol/layer/Vector';
import { toLonLat } from 'ol/proj';
import { Vector } from 'ol/source';

import MapsetAPI from '../../api/MapsetApi';
import MapsetKmlFormat from '../utils/MapsetKmlFormat';

import type { Map } from 'ol';
import type { FeatureLike } from 'ol/Feature';
import type { Options } from 'ol/layer/Vector';

import type { MapsetPlan } from '../../types';

import type { MobilityLayerOptions } from './Layer';

type MapsetLayerOptions = {
  apiKey?: string;
  apiUrl?: string;
  bbox?: null | number[];
  doNotRevert32pxScaling?: boolean;
  tags?: string[];
  tenants?: string[];
} & MobilityLayerOptions &
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

  get apiUrl(): string {
    return this.get('apiUrl') as string;
  }
  set apiUrl(value: string) {
    if (this.apiUrl !== value) {
      this.set('apiUrl', value);
      void this.updateData();
    }
  }

  get bbox(): null | number[] {
    return this.get('bbox') as null | number[];
  }
  set bbox(value: null | number[]) {
    // Compare arrays to avoid duplicate calls
    const current = this.bbox;
    const changed =
      !current ||
      current.some((v, i) => {
        return v !== value?.[i];
      });
    if (changed) {
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

  get map(): Map | null {
    return this.get('map') as Map | null;
  }
  set map(value: Map | null) {
    if (this.map !== value) {
      this.set('map', value);
    }
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
        return tag !== value[i];
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
        return tenant !== value[i];
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

  #abortController: AbortController;

  constructor(options: MapsetLayerOptions = {}) {
    super({ ...options, source: new Vector<FeatureLike>() });
    this.apiKey = options.apiKey ?? '';
    this.apiUrl = options.apiUrl ?? 'https://editor.dev.mapset.io/api/v1';
    this.bbox = options.bbox ?? null;
    this.map = null;
    this.#abortController = new AbortController();
    this.plans = [];
    this.doNotRevert32pxScaling = options.doNotRevert32pxScaling ?? false;
    this.api = undefined;
  }

  public loadPlans() {
    this.getSource()?.clear();

    if (!this.plans || this.plans?.length === 0 || !this.map) {
      console.warn('MapsetLayer: No plans to load');
      return;
    }

    this.plans?.forEach((plan) => {
      const features = kmlFormatter.readFeatures(
        plan.data,
        this.map?.getView().getProjection(),
        this.doNotRevert32pxScaling,
      );
      this.getSource()?.addFeatures(features || []);
    });

    this.dispatchEvent('load:plans');
  }

  override setMapInternal(map: Map) {
    super.setMapInternal(map);
    if (map) {
      this.map = map;
      this.map.once('change:view', () => {
        void this.updateData();
      });
    }
  }

  public async updateData() {
    if (!this.map || !this.get('apiUrl') || !this.map.getView()) {
      console.warn(
        'MapsetLayer: map, view or apiUrl not set, cannot fetch plans',
        {
          apiUrl: this.get('apiUrl') as string,
          map: this.map,
          view: this.map?.getView(),
        },
      );
      return;
    }

    const bbox = this.map.getView().calculateExtent(this.map.getSize());

    this.api = new MapsetAPI({
      apiKey: this.apiKey,
      bbox:
        (bbox && [
          ...toLonLat([bbox[0], bbox[1]]),
          ...toLonLat([bbox[2], bbox[3]]),
        ]) ||
        undefined,
      tags: this.tags || [],
      tenants: this.tenants || [],
      timestamp: this.timestamp,
      url: this.apiUrl,
      zoom: Math.floor(this.map.getView().getZoom() || 1),
    });

    let plans: MapsetPlan[] = [];

    try {
      plans = await this.api.getPlans(
        {},
        { signal: this.#abortController.signal },
      );
    } catch (e) {
      console.error('MapsetLayer: Error fetching plans...', e);
    }

    this.plans = plans;
  }
}

export default MapsetLayer;
