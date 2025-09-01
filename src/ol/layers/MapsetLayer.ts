import VectorLayer from 'ol/layer/Vector';
import { Vector } from 'ol/source';

import type { Map } from 'ol';
import type { FeatureLike } from 'ol/Feature';
import type { Options } from 'ol/layer/Vector';

import type { MobilityLayerOptions } from './Layer';

type MapsetLayerOptions = {
  apiKey?: string;
  apiUrl?: string;
  bbox?: null | number[];
} & MobilityLayerOptions &
  Options;

interface MapsetPlanItem {
  id: string;
  kml: string;
}

class MapsetLayer extends VectorLayer<Vector<FeatureLike>> {
  get apiKey(): string {
    return this.get('apiKey') as string;
  }
  set apiKey(value: string) {
    if (this.apiKey !== value) {
      this.set('apiKey', value);
      void this.fetchPlans();
    }
  }

  get apiUrl(): string {
    return this.get('apiUrl') as string;
  }
  set apiUrl(value: string) {
    if (this.apiUrl !== value) {
      this.set('apiUrl', value);
      void this.fetchPlans();
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
      void this.fetchPlans();
    }
  }

  get map(): Map | null {
    return this.get('map') as Map | null;
  }
  set map(value: Map | null) {
    if (this.map !== value) {
      this.set('map', value);
    }
  }

  get plans(): MapsetPlanItem[] {
    return this.get('plans') as MapsetPlanItem[];
  }
  // ❌ No fetchPlans here — prevents infinite loop
  set plans(value: MapsetPlanItem[]) {
    this.set('plans', value);
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
      void this.fetchPlans();
    }
  }
  #abortController: AbortController;
  constructor(options: MapsetLayerOptions) {
    super({ ...options, source: new Vector<FeatureLike>() });
    this.apiKey = options.apiKey ?? '';
    this.apiUrl = options.apiUrl ?? 'https://httpbin.org/get';
    this.bbox = options.bbox ?? null;
    this.map = null;
    this.#abortController = new AbortController();
    this.plans = [];
  }

  public async fetchPlans() {
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

    const extent = this.map.getView().calculateExtent(this.map.getSize());
    const url = `${this.get('apiUrl')}?bbox=${extent.toString()}&apiKey=${this.apiKey || ''}&tags=${(this.get('tags') as string[])?.toString() || ''}`;

    try {
      this.#abortController?.abort();
      this.#abortController = new AbortController();
      console.log('Fetching data from', url);
      const response = await fetch(url, {
        signal: this.#abortController.signal,
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      this.plans = (await response.json()) as MapsetPlanItem[];
    } catch (error) {
      if (error instanceof Error && error?.name === 'AbortError') {
        console.log('Fetch aborted');
      } else {
        console.error('Error fetching plans:', error);
      }
      return; // prevent rethrow
    }
  }

  override setMapInternal(map: Map) {
    if (map) {
      super.setMapInternal(map);
      this.map = map;
      this.map.once('change:view', () => {
        void this.fetchPlans();
      });
    } else {
      super.setMapInternal(map);
    }
  }
}

export default MapsetLayer;
