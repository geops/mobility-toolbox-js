import View from 'ol/View';
import Map from 'ol/Map';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import LineString from 'ol/geom/LineString';
import Modify from 'ol/interaction/Modify';
import { MaplibreLayer, MapsetLayer } from './build/ol';
import 'ol/ol.css';
import { buffer, getCenter } from 'ol/extent';
import { transformExtent } from 'ol/proj';

window.apiKey = '5cc87b12d7c5370001c1d6554840ecb89d2743d2b0aad0588b8ba7eb';

const baseLayer = new MaplibreLayer({
  apiKey: window.apiKey,
});

const mapsetLayer = new MapsetLayer({
  tenants: ['geopstest'],
});

// Creates the map
const map = new Map({
  layers: [baseLayer, mapsetLayer],
  target: 'map',
  view: new View({
    center: [950690.34, 6003962.67],
    zoom: 20,
  }),
});

const kmlTextArea = document?.getElementById('kml-input');

kmlTextArea?.addEventListener('change', (event) => {
  const kmlText = event.target.value;
  mapsetLayer.plans = [
    {
      data: kmlText,
    },
  ];
});

kmlTextArea.value = `<kml xmlns="http://www.opengis.net/kml/2.2" xmlns:gx="http://www.google.com/kml/ext/2.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.opengis.net/kml/2.2 https://developers.google.com/kml/schema/kml22gx.xsd"><Document><name>saveLayer</name><Placemark><Style><LineStyle><color>ffa18769</color><width>8</width></LineStyle></Style><ExtendedData><Data name="lineCap"><value>round</value></Data><Data name="lineDash"><value>10,10</value></Data><Data name="lineStartIcon"><value>{"scale":0.20833333333333331,"size":[300,300],"url":"https://editor.mapset.ch/static/images/arrowLeftW.png","zIndex":250}</value></Data><Data name="maxZoom"><value>20</value></Data><Data name="zIndex"><value>250</value></Data></ExtendedData><LineString><coordinates>7.605494346145647,48.039455442199,0 7.62422571594322,48.02640045521156,0 7.646914417388169,48.03998462866778,0</coordinates></LineString></Placemark><Placemark><Style><IconStyle><scale>1.5</scale><Icon><href>https://editor.mapset.ch/static/images/geops/Nr.11_1_021-1_v1.png</href><gx:w>144</gx:w><gx:h>144</gx:h></Icon></IconStyle></Style><ExtendedData><Data name="iconScale"><value>0.3333333333333333</value></Data><Data name="maxZoom"><value>20</value></Data><Data name="zIndex"><value>300</value></Data></ExtendedData><Point><coordinates>7.678949902637376,48.09794488303547,0</coordinates></Point></Placemark><Placemark><Style><LineStyle><color>00000000</color><width>2</width></LineStyle><PolyStyle><color>824149a9</color></PolyStyle></Style><ExtendedData><Data name="lineDash"><value>1,1</value></Data><Data name="maxZoom"><value>20</value></Data><Data name="zIndex"><value>200</value></Data></ExtendedData><Polygon><outerBoundaryIs><LinearRing><coordinates>7.614041427655932,48.06979860117991,0 7.625128387295897,48.09078530093589,0 7.647302306575824,48.10083472123296,0 7.665516597412908,48.085671684092944,0 7.695233180376035,48.08425618522651,0 7.688482442381406,48.05956668611111,0 7.641758826755842,48.054802859422125,0 7.6275041643616035,48.05127381472937,0 7.614041427655932,48.06979860117991,0</coordinates></LinearRing></outerBoundaryIs></Polygon></Placemark><Placemark><name>Foo Fizz
Bar</name><Style><IconStyle><scale>0</scale></IconStyle><LabelStyle><color>ff000000</color><scale>1.5</scale></LabelStyle></Style><ExtendedData><Data name="maxZoom"><value>20</value></Data><Data name="textAlign"><value>center</value></Data><Data name="textArray"><value>["Foo Fizz","","\n","","​Bar",""]</value></Data><Data name="textBackgroundFillColor"><value>rgba(196,41,55,1)</value></Data><Data name="textFont"><value>18px lato</value></Data><Data name="textPadding"><value>7,10,5,10</value></Data><Data name="textRotation"><value>-0.02099384556098904</value></Data><Data name="zIndex"><value>300</value></Data></ExtendedData><Point><coordinates>7.694620155159875,48.03693098841495,0</coordinates></Point></Placemark></Document></kml>`;
kmlTextArea.dispatchEvent(new Event('change'));

const tenantsInput = document?.getElementById('tenants-input');
tenantsInput?.addEventListener('change', (event) => {
  const tenantsText = event.target.value;
  mapsetLayer.tenants = tenantsText?.split(',')?.map((t) => t.trim());
});

const tagsInput = document?.getElementById('tags-input');
tagsInput?.addEventListener('change', (event) => {
  const tagsText = event.target.value;
  mapsetLayer.tags = tagsText?.split(',')?.map((t) => t.trim());
});
