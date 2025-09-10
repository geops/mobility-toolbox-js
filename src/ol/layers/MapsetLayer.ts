import { KML } from 'ol/format';
import VectorLayer from 'ol/layer/Vector';
import { Vector } from 'ol/source';

import MapsetAPI from '../../api/MapsetApi';

import type { Map } from 'ol';
import type { FeatureLike } from 'ol/Feature';
import type { Options } from 'ol/layer/Vector';

import type { MapsetPlan } from '../../types';

import type { MobilityLayerOptions } from './Layer';

type MapsetLayerOptions = {
  apiKey?: string;
  apiUrl?: string;
  bbox?: null | number[];
} & MobilityLayerOptions &
  Options;

const kmlFormatter = new KML();

const dummy = {
  admin_id: '62a7d959-d2e2-4ee2-bde5-4a1f88bd6bfe',
  created_at: '2025-02-20T09:04:06.867782Z',
  data: '<kml xmlns="http://www.opengis.net/kml/2.2" xmlns:gx="http://www.google.com/kml/ext/2.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.opengis.net/kml/2.2 https://developers.google.com/kml/schema/kml22gx.xsd"><Document><name>saveLayer</name><Placemark><Style><LineStyle><color>ff0000eb</color><width>4</width></LineStyle></Style><ExtendedData><Data name="lineCap"><value>round</value></Data><Data name="lineDash"><value>1,10</value></Data><Data name="maxZoom"><value>20</value></Data><Data name="zIndex"><value>250</value></Data></ExtendedData><LineString><coordinates>7.44049624064933,46.9492381650723,0 7.440758871138945,46.948451303205104,0 7.439912617339076,46.94826205622027,0 7.439883436173564,46.947624587769724,0 7.437475990018765,46.9471962843906,0</coordinates></LineString></Placemark></Document></kml>',
  modified_at: '2025-09-10T10:39:22.644887Z',
  queryparams:
    'x=828332.35&y=5933742.84&z=16.56&baselayer=ch.sbb.netzkarte&hidden.layers=haltestellenschilder%2Cbuslinien&layers=haltestellen%2Chaltekanten%2Cfusswege%2Cpois%2Cbahnlinien%2Ctramlinien%2Cubahnlinien%2Cschiffslinien%2Cseilbahnen%2Cbahnofplan%2Cunterfuehrungen%2Cp%C3%A4rke%2Cstrassen%2Cgew%C3%A4sserlabel%2Cortslabel%2Ctunnelbeschriftungen',
  read_id: '885ce8c1-05f3-4c81-8245-0c9b91648c81',
};

const dummy2 = {
  admin_id: '33551dfa-4916-411f-993d-d6df96f3d29f',
  created_at: '2023-04-27T13:12:33.323706Z',
  data: '<kml xmlns="http://www.opengis.net/kml/2.2" xmlns:gx="http://www.google.com/kml/ext/2.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.opengis.net/kml/2.2 https://developers.google.com/kml/schema/kml22gx.xsd"><Document><name>saveLayer</name><Placemark><Style><IconStyle><scale>3.270833</scale><Icon><href>https://icon-generator.geops.io/pictogram?border=%2C%2C&amp;color=%2C%2C&amp;columns=2&amp;fill=inc%3Abernmobil%2Fbernmobil_G4_Eigerplatz_v1.png%2Cinc%3Abernmobil%2Fbernmobil_G_Wichtrach_v1.png%2Cinc%3Abernmobil%2Fbernmobil_Poller_v1.png&amp;fontsize=%2C%2C&amp;format=png&amp;iconMargin=26&amp;iconSize=144&amp;text=%2C%2C&amp;urlPrefix=https%3A%2F%2Feditor.mapset.ch%2Fstatic%2Fimages%2F</href><gx:w>314</gx:w><gx:h>314</gx:h></Icon></IconStyle></Style><ExtendedData><Data name="iconScale"><value>0.3333333333333333</value></Data><Data name="maxZoom"><value>20</value></Data><Data name="zIndex"><value>300</value></Data></ExtendedData><Point><coordinates>7.431855213629502,46.947943271014935,0</coordinates></Point></Placemark><Placemark><description></description><Style><LineStyle><color>ff0000eb</color><width>4</width></LineStyle><PolyStyle><fill>0</fill></PolyStyle></Style><ExtendedData><Data name="fillPattern"><value>{"id":2,"color":[235,0,0,1]}</value></Data><Data name="lineDash"><value>1,1</value></Data><Data name="maxZoom"><value>20</value></Data><Data name="zIndex"><value>200</value></Data></ExtendedData><Polygon><outerBoundaryIs><LinearRing><coordinates>7.439444894285444,46.9490305694807,0 7.439523867070709,46.94879851870894,0 7.439578804660459,46.948807894517245,0 7.4396921134393175,46.948505523873365,0 7.440433770900945,46.948627409919794,0 7.440193418945787,46.949286058560716,0 7.440371966112475,46.94932121751296,0 7.440444071699023,46.94992829177957,0 7.440330762920163,46.94992829177957,0 7.4402689581316945,46.94964233487471,0 7.4401625165515535,46.94964936662018,0 7.440100711763084,46.94974077922751,0 7.439575371061099,46.94912198314486,0 7.439444894285444,46.9490305694807,0</coordinates></LinearRing></outerBoundaryIs></Polygon></Placemark><Placemark><description></description><Style><LineStyle><color>ff0000eb</color><width>4</width></LineStyle></Style><ExtendedData><Data name="lineDash"><value>10,10</value></Data><Data name="maxZoom"><value>20</value></Data><Data name="zIndex"><value>250</value></Data></ExtendedData><LineString><coordinates>7.439935898993834,46.94854771522853,0 7.4400114381797415,46.948453956616305,0 7.440107578961803,46.948409421217946,0 7.440244922936179,46.94810704832301,0</coordinates></LineString></Placemark><Placemark><name>Text hier eingeben</name><description></description><Style><IconStyle><scale>0</scale></IconStyle><LabelStyle><color>ffd4773c</color><scale>1.5</scale></LabelStyle></Style><ExtendedData><Data name="maxZoom"><value>20</value></Data><Data name="textAlign"><value>center</value></Data><Data name="textArray"><value>["Text hier eingeben",""]</value></Data><Data name="textBackgroundFillColor"><value>rgba(255,138,61,1)</value></Data><Data name="textFont"><value>18px lato</value></Data><Data name="textPadding"><value>7,10,5,10</value></Data><Data name="textStrokeColor"><value>rgba(255,255,255,1)</value></Data><Data name="textStrokeWidth"><value>2</value></Data><Data name="zIndex"><value>300</value></Data></ExtendedData><Point><coordinates>7.43583108420717,46.945743457661365,0</coordinates></Point></Placemark><Placemark><Style><IconStyle><scale>0.8125</scale><Icon><href>https://icon-generator.geops.io/pictogram?urlPrefix=https%3A%2F%2Feditor.mapset.ch%2Fstatic%2Fimages%2F&amp;columns=2&amp;color=%2C&amp;fontsize=%2C&amp;text=%2C&amp;fill=inc%3Ageops%2F3001_Tram_r_v1.png%2Cinc%3ARBS%2F09_Gleis-9_g_de_v1.png&amp;iconMargin=26&amp;iconSize=144&amp;format=png&amp;border=%2C</href><gx:w>314</gx:w><gx:h>144</gx:h></Icon></IconStyle></Style><ExtendedData><Data name="iconScale"><value>0.18055555555555555</value></Data><Data name="maxZoom"><value>20</value></Data><Data name="zIndex"><value>300</value></Data></ExtendedData><Point><coordinates>7.433228153081834,46.94796021454172,0</coordinates></Point></Placemark><Placemark><description></description><Style><IconStyle><scale>1.499998</scale><Icon><href>https://editor.mapset.ch/static/images/SBB/07_Gleis-7_g_de_v1.png</href><gx:w>144</gx:w><gx:h>144</gx:h></Icon></IconStyle></Style><ExtendedData><Data name="iconScale"><value>0.33333299999999993</value></Data><Data name="maxZoom"><value>20</value></Data><Data name="zIndex"><value>300</value></Data></ExtendedData><Point><coordinates>7.436965596303211,46.94799020923085,0</coordinates></Point></Placemark><Placemark><name>Das ist ein Standard-Plan</name><description></description><Style><IconStyle><scale>0</scale></IconStyle><LabelStyle><color>ff3d8aff</color><scale>1.5</scale></LabelStyle></Style><ExtendedData><Data name="maxZoom"><value>20</value></Data><Data name="textAlign"><value>center</value></Data><Data name="textArray"><value>["Das ist ein Standard-Plan",""]</value></Data><Data name="textBackgroundFillColor"><value>rgba(53,53,53,1)</value></Data><Data name="textFont"><value>18px lato</value></Data><Data name="textPadding"><value>7,10,5,10</value></Data><Data name="zIndex"><value>300</value></Data></ExtendedData><Point><coordinates>7.432201968734672,46.949002471941725,0</coordinates></Point></Placemark><Placemark><description></description><Style><IconStyle><scale>1.5</scale><Icon><href>https://editor.mapset.ch/static/images/geops/ersatzverkehr_io_v1.png</href><gx:w>144</gx:w><gx:h>144</gx:h></Icon></IconStyle></Style><ExtendedData><Data name="iconScale"><value>0.3333333333333333</value></Data><Data name="maxZoom"><value>20</value></Data><Data name="zIndex"><value>300</value></Data></ExtendedData><Point><coordinates>7.435126315604277,46.95017231343272,0</coordinates></Point></Placemark></Document></kml>',
  modified_at: '2025-09-10T09:48:10.729576Z',
  queryparams:
    'x=827579.55&y=5933624.22&z=17.01&baselayer=ch.sbb.netzkarte_saturiert&hidden.layers=haltestellenschilder%2Cbuslinien&layers=haltestellen%2Chaltekanten%2Cfusswege%2Cpois%2Cbahnlinien%2Ctramlinien%2Cubahnlinien%2Cschiffslinien%2Cseilbahnen%2Cbahnofplan%2Cunterfuehrungen%2Cp%C3%A4rke%2Cstrassen%2Cgew%C3%A4sserlabel%2Cortslabel%2Ctunnelbeschriftungen',
  read_id: 'c392461a-3b98-4cc2-a3a1-86191b10e117',
};

const dummy3 = {
  admin_id: 'ef629e95-8e4f-4975-b1a2-89af0a431934',
  created_at: '2025-02-20T09:50:15.830440Z',
  data: '<kml xmlns="http://www.opengis.net/kml/2.2" xmlns:gx="http://www.google.com/kml/ext/2.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.opengis.net/kml/2.2 https://developers.google.com/kml/schema/kml22gx.xsd"><Document><name>saveLayer</name><Placemark><Style><IconStyle><scale>1.5</scale><Icon><href>https://editor.mapset.ch/static/images/SBB/02_Gleis-2_g_de_v1.png</href><gx:w>144</gx:w><gx:h>144</gx:h></Icon></IconStyle></Style><ExtendedData><Data name="iconScale"><value>0.3333333333333333</value></Data><Data name="maxZoom"><value>20</value></Data><Data name="zIndex"><value>300</value></Data></ExtendedData><Point><coordinates>7.45543967438998,46.95370548533157,0</coordinates></Point></Placemark></Document></kml>',
  modified_at: '2025-09-10T09:54:11.965930Z',
  queryparams:
    'x=829991.98&y=5934149.25&z=16.44&baselayer=ch.sbb.netzkarte&hidden.layers=haltestellenschilder%2Cbuslinien&layers=haltestellen%2Chaltekanten%2Cfusswege%2Cpois%2Cbahnlinien%2Ctramlinien%2Cubahnlinien%2Cschiffslinien%2Cseilbahnen%2Cbahnofplan%2Cunterfuehrungen%2Cp%C3%A4rke%2Cstrassen%2Cgew%C3%A4sserlabel%2Cortslabel%2Ctunnelbeschriftungen',
  read_id: '9412bfdb-5f3c-4764-a188-4cea1f1787b8',
};

class MapsetLayer extends VectorLayer<Vector<FeatureLike>> {
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
  #abortController: AbortController;
  constructor(options: MapsetLayerOptions = {}) {
    super({ ...options, source: new Vector<FeatureLike>() });
    this.apiKey = options.apiKey ?? '';
    this.apiUrl = options.apiUrl ?? 'https://editor.mapset.io/api/v1';
    this.bbox = options.bbox ?? null;
    this.map = null;
    this.#abortController = new AbortController();
    this.plans = [];
  }

  public loadPlans() {
    if (!this.plans || this.plans.length === 0 || !this.map) {
      console.warn('MapsetLayer: No plans to load');
      return;
    }

    this.plans.forEach((plan) => {
      const features = kmlFormatter.readFeatures(plan.data, {
        dataProjection: 'EPSG:4326',
        featureProjection: this.map?.getView().getProjection(),
      });
      this.getSource()?.addFeatures(features || []);
    });

    this.map?.getView().fit(this.getSource()?.getExtent() || [], {
      duration: 1000,
      padding: [200, 200, 200, 200],
    });
  }

  override setMapInternal(map: Map) {
    if (map) {
      super.setMapInternal(map);
      this.map = map;
      this.map.once('change:view', () => {
        void this.updateData();
      });
    } else {
      super.setMapInternal(map);
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

    const api = new MapsetAPI({
      apiKey: this.apiKey,
      bbox: this.bbox || undefined,
      tags: this.tags || [],
      url: this.apiUrl,
    });

    let plans = [];

    try {
      plans = await api.getPlans(
        { bbox, tags: this.tags },
        { signal: this.#abortController.signal },
      );
    } catch (e) {
      console.error(
        'MapsetLayer: Error fetching plans, using dummy plans...',
        e,
      );
      plans = [dummy, dummy2, dummy3];
    }

    if (plans) {
      this.plans = plans;
      this.loadPlans();
    }
  }
}

export default MapsetLayer;
