import View from 'ol/View';
import Map from 'ol/Map';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import LineString from 'ol/geom/LineString';
import Modify from 'ol/interaction/Modify';
import {
  MaplibreLayer,
  RealtimeLayer,
  RoutingControl,
  routingStyle,
  MocoAPI,
  MocoLayer,
  CopyrightControl,
  getGraphByZoom,
} from './build/ol';
import 'ol/ol.css';
import { buffer, getCenter } from 'ol/extent';
import { transformExtent } from 'ol/proj';

window.apiKey = '5cc87b12d7c5370001c1d6554840ecb89d2743d2b0aad0588b8ba7eb';

const RVF_EXTENT_4326 = [7.5, 47.7, 8.45, 48.4];

const RVF_EXTENT_3857 = transformExtent(
  RVF_EXTENT_4326,
  'EPSG:4326',
  'EPSG:3857',
);

// const bbox = RVF_EXTENT_3857.join(',');
const rvfCenter = getCenter(RVF_EXTENT_3857);
// const mocoApi = new MocoAPI();
// console.log('MocoAPI: ', mocoApi);
// mocoApi
//   .getNotifications({ addStatusProperties: true, date: new Date() })
//   .then((response) => {
//     console.log('MocoAPI response: ', response);
//   })
//   .catch((error) => {
//     console.error('Error fetching notifications: ', error);
//   });

// mocoApi
//   .getNotificationsAsFeatureCollection({
//     addStatusProperties: true,
//     date: new Date(),
//   })
//   .then((response) => {
//     console.log('MocoAPI response 2: ', response);
//   })
//   .catch((error) => {
//     console.error('Error fetching notifications: ', error);
//   });
const map = new Map({
  target: 'map',
  view: new View({
    // Zurich
    // center: [950690.34, 6003962.67],
    // rvf params:
    center: rvfCenter,
    zoom: 10,
  }),
});

const baseLayer = new MaplibreLayer({
  apiKey: window.apiKey,
  // style: 'de.rvf_moco',
  style: 'de.rvf_moco',
  url: 'https://maps.test.geops.io',
});
baseLayer.on('load', () => {
  console.log('baseLayer loaded');
});

map.addLayer(baseLayer);

const mocoLayer = new MocoLayer({
  apiKey: window.apiKey,
  url: 'https://moco.dev.geops.io/api/v2/',
  maplibreLayer: baseLayer,
  tenant: 'rvf',
  loadAll: true,
  // date: new Date('2025-09-10T00:00:00Z'),
  // notifications: [
  //   {
  //     features: [],
  //     properties: {
  //       id: '374699',
  //       title: 'Haltestelle Lienzingen Schule: Änderung wegen Bauarbeiten',
  //       publicationStopNames: [],
  //       publicationLineNames: [],
  //       affectedTimeIntervalsStart: '2025-06-30T22:00:00+00:00',
  //       affectedTimeIntervalsEnd: '2500-12-31T00:00:00+00:00',
  //       publicationWindowsStart: '2025-06-30T08:00:00+00:00',
  //       publicationWindowsEnd: '2500-12-31T00:10:00+00:00',
  //       reasons: [
  //         {
  //           category_name: 'Technische Probleme',
  //           name: 'Bauarbeiten',
  //         },
  //       ],
  //       affectedTimeIntervals: [
  //         {
  //           id: '282833',
  //           startTime: '2025-06-30T22:00:00+00:00',
  //           endTime: '2500-12-31T00:00:00+00:00',
  //         },
  //       ],
  //       publicationWindows: [
  //         {
  //           id: '275178',
  //           startTime: '2025-06-30T08:00:00+00:00',
  //           endTime: '2500-12-31T00:10:00+00:00',
  //         },
  //       ],
  //       publications: [
  //         {
  //           visible_from: '2025-06-30T08:00:00+00:00',
  //           visible_until: '2500-12-31T00:10:00+00:00',
  //         },
  //       ],
  //       affected_time_intervals: [
  //         {
  //           end: '2500-12-31T00:00:00+00:00',
  //           start: '2025-06-30T22:00:00+00:00',
  //         },
  //       ],
  //     },
  //     type: 'FeatureCollection',
  //   },
  //   {
  //     features: [],
  //     properties: {
  //       id: '374702',
  //       title:
  //         'Unregelmässiger Betrieb zwischen General Guisan-Strasse und Holee',
  //       publicationStopNames: [],
  //       publicationLineNames: [],
  //       affectedTimeIntervalsStart: '2025-06-30T02:30:00+00:00',
  //       affectedTimeIntervalsEnd: '2026-04-29T22:00:00+00:00',
  //       publicationWindowsStart: '2025-06-27T05:00:00+00:00',
  //       publicationWindowsEnd: '2026-04-29T22:00:00+00:00',
  //       reasons: [
  //         {
  //           category_name: 'Technische Probleme',
  //           name: 'Bauarbeiten',
  //         },
  //       ],
  //       affectedTimeIntervals: [
  //         {
  //           id: '282836',
  //           startTime: '2025-06-30T02:30:00+00:00',
  //           endTime: '2026-04-29T22:00:00+00:00',
  //         },
  //       ],
  //       publicationWindows: [
  //         {
  //           id: '275181',
  //           startTime: '2025-06-27T05:00:00+00:00',
  //           endTime: '2026-04-29T22:00:00+00:00',
  //         },
  //       ],
  //       publications: [
  //         {
  //           visible_from: '2025-06-27T05:00:00+00:00',
  //           visible_until: '2026-04-29T22:00:00+00:00',
  //         },
  //       ],
  //       affected_time_intervals: [
  //         {
  //           end: '2026-04-29T22:00:00+00:00',
  //           start: '2025-06-30T02:30:00+00:00',
  //         },
  //       ],
  //     },
  //     type: 'FeatureCollection',
  //   },
  //   {
  //     features: [],
  //     properties: {
  //       id: '374704',
  //       title: 'Linien 731 und 933: Umleitung wegen Bauarbeiten',
  //       publicationStopNames: [],
  //       publicationLineNames: [],
  //       affectedTimeIntervalsStart: '2025-06-18T13:00:00+00:00',
  //       affectedTimeIntervalsEnd: '2026-03-01T02:00:00+00:00',
  //       publicationWindowsStart: '2025-06-18T13:00:00+00:00',
  //       publicationWindowsEnd: '2026-03-01T02:10:00+00:00',
  //       reasons: [
  //         {
  //           category_name: 'Technische Probleme',
  //           name: 'Bauarbeiten',
  //         },
  //       ],
  //       affectedTimeIntervals: [
  //         {
  //           id: '282838',
  //           startTime: '2025-06-18T13:00:00+00:00',
  //           endTime: '2026-03-01T02:00:00+00:00',
  //         },
  //       ],
  //       publicationWindows: [
  //         {
  //           id: '275183',
  //           startTime: '2025-06-18T13:00:00+00:00',
  //           endTime: '2026-03-01T02:10:00+00:00',
  //         },
  //       ],
  //       publications: [
  //         {
  //           visible_from: '2025-06-18T13:00:00+00:00',
  //           visible_until: '2026-03-01T02:10:00+00:00',
  //         },
  //       ],
  //       affected_time_intervals: [
  //         {
  //           end: '2026-03-01T02:00:00+00:00',
  //           start: '2025-06-18T13:00:00+00:00',
  //         },
  //       ],
  //     },
  //     type: 'FeatureCollection',
  //   },
  //   {
  //     features: [],
  //     properties: {
  //       id: '374705',
  //       title: 'Linien 703, 737 und 739: Verspätung wegen Bauarbeiten',
  //       publicationStopNames: [],
  //       publicationLineNames: [],
  //       affectedTimeIntervalsStart: '2025-06-17T22:00:00+00:00',
  //       affectedTimeIntervalsEnd: '2500-12-31T00:00:00+00:00',
  //       publicationWindowsStart: '2025-06-17T22:00:00+00:00',
  //       publicationWindowsEnd: '2500-12-31T00:10:00+00:00',
  //       reasons: [
  //         {
  //           category_name: 'Technische Probleme',
  //           name: 'Bauarbeiten',
  //         },
  //       ],
  //       affectedTimeIntervals: [
  //         {
  //           id: '282839',
  //           startTime: '2025-06-17T22:00:00+00:00',
  //           endTime: '2500-12-31T00:00:00+00:00',
  //         },
  //       ],
  //       publicationWindows: [
  //         {
  //           id: '275184',
  //           startTime: '2025-06-17T22:00:00+00:00',
  //           endTime: '2500-12-31T00:10:00+00:00',
  //         },
  //       ],
  //       publications: [
  //         {
  //           visible_from: '2025-06-17T22:00:00+00:00',
  //           visible_until: '2500-12-31T00:10:00+00:00',
  //         },
  //       ],
  //       affected_time_intervals: [
  //         {
  //           end: '2500-12-31T00:00:00+00:00',
  //           start: '2025-06-17T22:00:00+00:00',
  //         },
  //       ],
  //     },
  //     type: 'FeatureCollection',
  //   },
  //   {
  //     features: [],
  //     properties: {
  //       id: '374706',
  //       title: 'Linie 9: Umleitung wegen Bauarbeiten',
  //       publicationStopNames: [],
  //       publicationLineNames: [],
  //       affectedTimeIntervalsStart: '2025-06-18T13:00:00+00:00',
  //       affectedTimeIntervalsEnd: '2500-12-31T00:00:00+00:00',
  //       publicationWindowsStart: '2025-06-18T13:00:00+00:00',
  //       publicationWindowsEnd: '2500-12-31T00:10:00+00:00',
  //       reasons: [
  //         {
  //           category_name: 'Technische Probleme',
  //           name: 'Bauarbeiten',
  //         },
  //       ],
  //       affectedTimeIntervals: [
  //         {
  //           id: '282840',
  //           startTime: '2025-06-18T13:00:00+00:00',
  //           endTime: '2500-12-31T00:00:00+00:00',
  //         },
  //       ],
  //       publicationWindows: [
  //         {
  //           id: '275185',
  //           startTime: '2025-06-18T13:00:00+00:00',
  //           endTime: '2500-12-31T00:10:00+00:00',
  //         },
  //       ],
  //       publications: [
  //         {
  //           visible_from: '2025-06-18T13:00:00+00:00',
  //           visible_until: '2500-12-31T00:10:00+00:00',
  //         },
  //       ],
  //       affected_time_intervals: [
  //         {
  //           end: '2500-12-31T00:00:00+00:00',
  //           start: '2025-06-18T13:00:00+00:00',
  //         },
  //       ],
  //     },
  //     type: 'FeatureCollection',
  //   },
  //   {
  //     features: [],
  //     properties: {
  //       id: '374712',
  //       title: 'Linien 724, 725 und 917: Umleitung wegen Bauarbeiten',
  //       publicationStopNames: [],
  //       publicationLineNames: [],
  //       affectedTimeIntervalsStart: '2025-06-17T22:00:00+00:00',
  //       affectedTimeIntervalsEnd: '2025-12-01T15:00:00+00:00',
  //       publicationWindowsStart: '2025-06-17T22:00:00+00:00',
  //       publicationWindowsEnd: '2025-12-01T15:10:00+00:00',
  //       reasons: [
  //         {
  //           category_name: 'Technische Probleme',
  //           name: 'Bauarbeiten',
  //         },
  //       ],
  //       affectedTimeIntervals: [
  //         {
  //           id: '282846',
  //           startTime: '2025-06-17T22:00:00+00:00',
  //           endTime: '2025-12-01T15:00:00+00:00',
  //         },
  //       ],
  //       publicationWindows: [
  //         {
  //           id: '275191',
  //           startTime: '2025-06-17T22:00:00+00:00',
  //           endTime: '2025-12-01T15:10:00+00:00',
  //         },
  //       ],
  //       publications: [
  //         {
  //           visible_from: '2025-06-17T22:00:00+00:00',
  //           visible_until: '2025-12-01T15:10:00+00:00',
  //         },
  //       ],
  //       affected_time_intervals: [
  //         {
  //           end: '2025-12-01T15:00:00+00:00',
  //           start: '2025-06-17T22:00:00+00:00',
  //         },
  //       ],
  //     },
  //     type: 'FeatureCollection',
  //   },
  //   {
  //     features: [],
  //     properties: {
  //       id: '374713',
  //       title:
  //         'Haltestelle Huchenfeld Erzkopfstraße: Verlegung wegen Bauarbeiten',
  //       publicationStopNames: [],
  //       publicationLineNames: [],
  //       affectedTimeIntervalsStart: '2025-06-18T13:00:00+00:00',
  //       affectedTimeIntervalsEnd: '2500-12-31T00:00:00+00:00',
  //       publicationWindowsStart: '2025-06-18T13:00:00+00:00',
  //       publicationWindowsEnd: '2500-12-31T00:10:00+00:00',
  //       reasons: [
  //         {
  //           category_name: 'Technische Probleme',
  //           name: 'Bauarbeiten',
  //         },
  //       ],
  //       affectedTimeIntervals: [
  //         {
  //           id: '282847',
  //           startTime: '2025-06-18T13:00:00+00:00',
  //           endTime: '2500-12-31T00:00:00+00:00',
  //         },
  //       ],
  //       publicationWindows: [
  //         {
  //           id: '275192',
  //           startTime: '2025-06-18T13:00:00+00:00',
  //           endTime: '2500-12-31T00:10:00+00:00',
  //         },
  //       ],
  //       publications: [
  //         {
  //           visible_from: '2025-06-18T13:00:00+00:00',
  //           visible_until: '2500-12-31T00:10:00+00:00',
  //         },
  //       ],
  //       affected_time_intervals: [
  //         {
  //           end: '2500-12-31T00:00:00+00:00',
  //           start: '2025-06-18T13:00:00+00:00',
  //         },
  //       ],
  //     },
  //     type: 'FeatureCollection',
  //   },
  //   {
  //     features: [],
  //     properties: {
  //       id: '374714',
  //       title: 'Haltestelle Pforzheim Parkstraße: Verlegung wegen Bauarbeiten',
  //       publicationStopNames: [],
  //       publicationLineNames: [],
  //       affectedTimeIntervalsStart: '2025-06-18T13:00:00+00:00',
  //       affectedTimeIntervalsEnd: '2500-12-31T00:00:00+00:00',
  //       publicationWindowsStart: '2025-06-18T13:00:00+00:00',
  //       publicationWindowsEnd: '2500-12-31T00:10:00+00:00',
  //       reasons: [
  //         {
  //           category_name: 'Technische Probleme',
  //           name: 'Bauarbeiten',
  //         },
  //       ],
  //       affectedTimeIntervals: [
  //         {
  //           id: '282848',
  //           startTime: '2025-06-18T13:00:00+00:00',
  //           endTime: '2500-12-31T00:00:00+00:00',
  //         },
  //       ],
  //       publicationWindows: [
  //         {
  //           id: '275193',
  //           startTime: '2025-06-18T13:00:00+00:00',
  //           endTime: '2500-12-31T00:10:00+00:00',
  //         },
  //       ],
  //       publications: [
  //         {
  //           visible_from: '2025-06-18T13:00:00+00:00',
  //           visible_until: '2500-12-31T00:10:00+00:00',
  //         },
  //       ],
  //       affected_time_intervals: [
  //         {
  //           end: '2500-12-31T00:00:00+00:00',
  //           start: '2025-06-18T13:00:00+00:00',
  //         },
  //       ],
  //     },
  //     type: 'FeatureCollection',
  //   },
  //   {
  //     features: [],
  //     properties: {
  //       id: '374715',
  //       title: 'Haltestelle Huchenfeld Oberdorf: Verlegung wegen Bauarbeiten',
  //       publicationStopNames: [],
  //       publicationLineNames: [],
  //       affectedTimeIntervalsStart: '2025-06-18T13:00:00+00:00',
  //       affectedTimeIntervalsEnd: '2500-12-31T00:00:00+00:00',
  //       publicationWindowsStart: '2025-06-18T13:00:00+00:00',
  //       publicationWindowsEnd: '2500-12-31T00:10:00+00:00',
  //       reasons: [
  //         {
  //           category_name: 'Technische Probleme',
  //           name: 'Bauarbeiten',
  //         },
  //       ],
  //       affectedTimeIntervals: [
  //         {
  //           id: '282849',
  //           startTime: '2025-06-18T13:00:00+00:00',
  //           endTime: '2500-12-31T00:00:00+00:00',
  //         },
  //       ],
  //       publicationWindows: [
  //         {
  //           id: '275194',
  //           startTime: '2025-06-18T13:00:00+00:00',
  //           endTime: '2500-12-31T00:10:00+00:00',
  //         },
  //       ],
  //       publications: [
  //         {
  //           visible_from: '2025-06-18T13:00:00+00:00',
  //           visible_until: '2500-12-31T00:10:00+00:00',
  //         },
  //       ],
  //       affected_time_intervals: [
  //         {
  //           end: '2500-12-31T00:00:00+00:00',
  //           start: '2025-06-18T13:00:00+00:00',
  //         },
  //       ],
  //     },
  //     type: 'FeatureCollection',
  //   },
  //   {
  //     features: [],
  //     properties: {
  //       id: '374716',
  //       title:
  //         'Haltestelle Pforzheim Schwarzwaldstraße: Verlegung wegen Bauarbeiten',
  //       publicationStopNames: [],
  //       publicationLineNames: [],
  //       affectedTimeIntervalsStart: '2025-06-18T13:00:00+00:00',
  //       affectedTimeIntervalsEnd: '2500-12-31T00:00:00+00:00',
  //       publicationWindowsStart: '2025-06-18T13:00:00+00:00',
  //       publicationWindowsEnd: '2500-12-31T00:10:00+00:00',
  //       reasons: [
  //         {
  //           category_name: 'Technische Probleme',
  //           name: 'Bauarbeiten',
  //         },
  //       ],
  //       affectedTimeIntervals: [
  //         {
  //           id: '282850',
  //           startTime: '2025-06-18T13:00:00+00:00',
  //           endTime: '2500-12-31T00:00:00+00:00',
  //         },
  //       ],
  //       publicationWindows: [
  //         {
  //           id: '275195',
  //           startTime: '2025-06-18T13:00:00+00:00',
  //           endTime: '2500-12-31T00:10:00+00:00',
  //         },
  //       ],
  //       publications: [
  //         {
  //           visible_from: '2025-06-18T13:00:00+00:00',
  //           visible_until: '2500-12-31T00:10:00+00:00',
  //         },
  //       ],
  //       affected_time_intervals: [
  //         {
  //           end: '2500-12-31T00:00:00+00:00',
  //           start: '2025-06-18T13:00:00+00:00',
  //         },
  //       ],
  //     },
  //     type: 'FeatureCollection',
  //   },
  //   {
  //     features: [],
  //     properties: {
  //       id: '374718',
  //       title:
  //         'Haltestellen Oberried (Breisgau) Sternen/Post und Oberried (Breisgau) Adler: Haltestellenverlegung wegen einer Baumaßnahmexx',
  //       publicationStopNames: [],
  //       publicationLineNames: [],
  //       affectedTimeIntervalsStart: '2025-05-14T03:00:00+00:00',
  //       affectedTimeIntervalsEnd: '2025-08-30T23:00:00+00:00',
  //       publicationWindowsStart: '2025-05-12T03:00:00+00:00',
  //       publicationWindowsEnd: '2500-12-31T00:10:00+00:00',
  //       reasons: [
  //         {
  //           category_name: 'Unfall',
  //           name: 'Aufprall eines Objekts',
  //         },
  //       ],
  //       affectedTimeIntervals: [
  //         {
  //           id: '286617',
  //           startTime: '2025-05-14T03:00:00+00:00',
  //           endTime: '2025-08-30T23:00:00+00:00',
  //         },
  //       ],
  //       publicationWindows: [
  //         {
  //           id: '278749',
  //           startTime: '2025-05-12T03:00:00+00:00',
  //           endTime: '2500-12-31T00:10:00+00:00',
  //         },
  //       ],
  //       publications: [
  //         {
  //           visible_from: '2025-05-12T03:00:00+00:00',
  //           visible_until: '2500-12-31T00:10:00+00:00',
  //         },
  //       ],
  //       affected_time_intervals: [
  //         {
  //           end: '2025-08-30T23:00:00+00:00',
  //           start: '2025-05-14T03:00:00+00:00',
  //         },
  //       ],
  //     },
  //     type: 'FeatureCollection',
  //   },
  //   {
  //     features: [],
  //     properties: {
  //       id: '374721',
  //       title: '',
  //       publicationStopNames: [],
  //       publicationLineNames: [],
  //       affectedTimeIntervalsStart: '2025-04-27T22:00:00+00:00',
  //       affectedTimeIntervalsEnd: '2025-12-01T02:00:00+00:00',
  //       publicationWindowsStart: '2025-04-22T22:00:00+00:00',
  //       publicationWindowsEnd: '2025-12-01T02:10:00+00:00',
  //       reasons: [],
  //       affectedTimeIntervals: [
  //         {
  //           id: '282855',
  //           startTime: '2025-04-27T22:00:00+00:00',
  //           endTime: '2025-12-01T02:00:00+00:00',
  //         },
  //       ],
  //       publicationWindows: [
  //         {
  //           id: '275200',
  //           startTime: '2025-04-22T22:00:00+00:00',
  //           endTime: '2025-12-01T02:10:00+00:00',
  //         },
  //       ],
  //       publications: [
  //         {
  //           visible_from: '2025-04-22T22:00:00+00:00',
  //           visible_until: '2025-12-01T02:10:00+00:00',
  //         },
  //       ],
  //       affected_time_intervals: [
  //         {
  //           end: '2025-12-01T02:00:00+00:00',
  //           start: '2025-04-27T22:00:00+00:00',
  //         },
  //       ],
  //     },
  //     type: 'FeatureCollection',
  //   },
  //   {
  //     features: [
  //       {
  //         geometry: {
  //           type: 'MultiLineString',
  //           coordinates: [
  //             [
  //               [7.8932675903, 47.980540502099984],
  //               [7.8928025880999995, 47.980540502099984],
  //               [7.891997180699999, 47.980229236600024],
  //               [7.891912486699999, 47.980172543500004],
  //               [7.890867059399999, 47.979817538800035],
  //               [7.889681564, 47.97986564690001],
  //               [7.8577269770000004, 47.9824309542],
  //               [7.856542405899999, 47.982517],
  //               [7.856422630600001, 47.982517],
  //               [7.855524315299999, 47.98267811600002],
  //               [7.855195509099999, 47.98289820369999],
  //             ],
  //           ],
  //         },
  //         properties: {
  //           condition_group: 'information',
  //           graph: 'np_topo10',
  //           is_icon_ref: true,
  //           reasons: [
  //             {
  //               category_name: 'Technische Probleme',
  //               name: 'Bauarbeiten',
  //             },
  //           ],
  //           severity_group: 'high',
  //         },
  //         type: 'Feature',
  //       },
  //       {
  //         geometry: {
  //           type: 'MultiLineString',
  //           coordinates: [
  //             [
  //               [7.894194229599999, 47.98137446749999],
  //               [7.8924790304, 47.981850026700016],
  //               [7.889779122999999, 47.982367115399995],
  //               [7.8886820436, 47.98259959350003],
  //               [7.8875766072, 47.98281820190002],
  //               [7.8859050126, 47.983123362999976],
  //               [7.8842199799, 47.983405844600014],
  //               [7.882524127699999, 47.98367098040001],
  //               [7.8756742465, 47.9846675972],
  //               [7.872808436799999, 47.9851112373],
  //               [7.8722488733, 47.985125684000025],
  //               [7.8666324231, 47.985062801699996],
  //               [7.8642993233, 47.984886589300004],
  //               [7.8631349641999995, 47.98478644139999],
  //               [7.861976626, 47.984659023099994],
  //               [7.8614015308, 47.98458044860001],
  //               [7.860830545699999, 47.98448948320001],
  //               [7.8602650470999995, 47.984384320600014],
  //               [7.859706699399999, 47.984263264800006],
  //               [7.859157449599999, 47.98412480659999],
  //               [7.8586194885, 47.98396771199998],
  //               [7.858095194999999, 47.98379112160001],
  //               [7.857587038999999, 47.983594642300034],
  //               [7.857128406999999, 47.98347040349998],
  //               [7.855727258799999, 47.9831363015],
  //               [7.8553035518, 47.98297052230001],
  //               [7.854625999999998, 47.982517],
  //             ],
  //           ],
  //         },
  //         properties: {
  //           condition_group: 'information',
  //           graph: 'np_topo11',
  //           is_icon_ref: true,
  //           reasons: [
  //             {
  //               category_name: 'Technische Probleme',
  //               name: 'Bauarbeiten',
  //             },
  //           ],
  //           severity_group: 'high',
  //         },
  //         type: 'Feature',
  //       },
  //       {
  //         geometry: {
  //           type: 'MultiLineString',
  //           coordinates: [
  //             [
  //               [7.894366114800001, 47.98165223449999],
  //               [7.8939234828, 47.98177495920001],
  //               [7.8921014487, 47.98213629829999],
  //               [7.890720525699998, 47.98247204430001],
  //               [7.889324112199998, 47.982780978200026],
  //               [7.887914766599998, 47.9830659962],
  //               [7.8862096353, 47.98338077510002],
  //               [7.8844924633, 47.98367104810001],
  //               [7.882477622499998, 47.983986276900026],
  //               [7.876393161300001, 47.98486955400003],
  //               [7.8743620226, 47.98517401930002],
  //               [7.87291341, 47.985403548600004],
  //               [7.871513104899999, 47.98567790040002],
  //               [7.8712268515999995, 47.98570326020001],
  //               [7.8709327792, 47.98566893580002],
  //               [7.870351037500001, 47.98557925750001],
  //               [7.8683423249, 47.98519387600001],
  //               [7.867465090899999, 47.985074174300024],
  //               [7.8668732925, 47.985021476000014],
  //               [7.866278793799999, 47.984984606200015],
  //               [7.863894715100001, 47.9848904463],
  //               [7.863003619799999, 47.98483101719998],
  //               [7.862412811499999, 47.9847734487],
  //               [7.861826042399998, 47.98469968589998],
  //               [7.860956942899998, 47.984555473800015],
  //               [7.8601069779, 47.98436709330002],
  //               [7.859283906799999, 47.9841312785],
  //               [7.8584920961, 47.98385136820002],
  //               [7.856946441299999, 47.98324546120003],
  //               [7.8564220529, 47.983054404800015],
  //               [7.856155133099998, 47.9829649246],
  //               [7.855340333699999, 47.9827209078],
  //               [7.854625999999998, 47.982517],
  //             ],
  //           ],
  //         },
  //         properties: {
  //           condition_group: 'information',
  //           graph: 'np_topo12',
  //           is_icon_ref: true,
  //           reasons: [
  //             {
  //               category_name: 'Technische Probleme',
  //               name: 'Bauarbeiten',
  //             },
  //           ],
  //           severity_group: 'high',
  //         },
  //         type: 'Feature',
  //       },
  //       {
  //         geometry: {
  //           type: 'MultiLineString',
  //           coordinates: [
  //             [
  //               [7.8944520574, 47.98179111740001],
  //               [7.894114674099999, 47.98187802390004],
  //               [7.8916238789, 47.982406065200024],
  //               [7.888658893400001, 47.98309003099999],
  //               [7.8878085131, 47.98326562950001],
  //               [7.886950104099999, 47.98342500800001],
  //               [7.885215276700001, 47.98370898030001],
  //               [7.877491084599999, 47.9848782226],
  //               [7.8750119036, 47.985242298200006],
  //               [7.8731159237999995, 47.98550224020002],
  //               [7.8730010697, 47.98553762380001],
  //               [7.872681698, 47.985678819900016],
  //               [7.8725647267, 47.985710503400014],
  //               [7.871968880699999, 47.98574070709998],
  //               [7.8713718972999995, 47.98572655930002],
  //               [7.870782339399999, 47.985661728399975],
  //               [7.8702030774, 47.985563180300005],
  //               [7.8690575586, 47.98533418459999],
  //               [7.8683355186, 47.98520563690002],
  //               [7.867605445199999, 47.985099349999984],
  //               [7.866868772999999, 47.985015923899994],
  //               [7.8661270875, 47.984955568600014],
  //               [7.8653823968999985, 47.984914808599996],
  //               [7.8631431876, 47.984846038200004],
  //               [7.862397736999999, 47.98481230940001],
  //               [7.8618055244999985, 47.98475879760002],
  //               [7.8613687116, 47.98469166800001],
  //               [7.861082833699999, 47.9846333676],
  //               [7.8606623795, 47.98452935660001],
  //               [7.859981116599999, 47.98432416419999],
  //               [7.857332171999999, 47.98339772630001],
  //               [7.855336251899998, 47.982714752899994],
  //               [7.854625999999998, 47.982517],
  //             ],
  //           ],
  //         },
  //         properties: {
  //           condition_group: 'information',
  //           graph: 'np_topo13',
  //           is_icon_ref: true,
  //           reasons: [
  //             {
  //               category_name: 'Technische Probleme',
  //               name: 'Bauarbeiten',
  //             },
  //           ],
  //           severity_group: 'high',
  //         },
  //         type: 'Feature',
  //       },
  //       {
  //         geometry: {
  //           type: 'MultiLineString',
  //           coordinates: [
  //             [
  //               [7.8944950287, 47.98186055880001],
  //               [7.8929750398, 47.98227032090003],
  //               [7.888581352399998, 47.98325378750002],
  //               [7.887439107, 47.9834900637],
  //               [7.886502888199999, 47.98366337780001],
  //               [7.885194897699999, 47.98387303110002],
  //               [7.873819350599999, 47.9855768381],
  //               [7.8728639531999995, 47.98569357010001],
  //               [7.872492766999999, 47.98572183249999],
  //               [7.872119827100001, 47.98573623240003],
  //               [7.8717463083, 47.98573383830001],
  //               [7.871448327799999, 47.985718551800005],
  //               [7.8707109496999985, 47.985638902399984],
  //               [7.869912292599999, 47.985509151900004],
  //               [7.8681161269, 47.98516587309999],
  //               [7.867605235999999, 47.98509097409999],
  //               [7.8670894357, 47.98503299340001],
  //               [7.866422034199999, 47.98497786790003],
  //               [7.8656775857, 47.98493493130002],
  //               [7.8622463318, 47.98479924520001],
  //               [7.861801241199999, 47.98476373630001],
  //               [7.8613631044000005, 47.98470073760001],
  //               [7.8607964008, 47.98457404039999],
  //               [7.8601820618, 47.984391194899985],
  //               [7.8549394671, 47.9825750903],
  //               [7.854736658000001, 47.98254768070001],
  //               [7.854625999999998, 47.982517],
  //             ],
  //           ],
  //         },
  //         properties: {
  //           condition_group: 'information',
  //           graph: 'np_topo14',
  //           is_icon_ref: true,
  //           reasons: [
  //             {
  //               category_name: 'Technische Probleme',
  //               name: 'Bauarbeiten',
  //             },
  //           ],
  //           severity_group: 'high',
  //         },
  //         type: 'Feature',
  //       },
  //       {
  //         geometry: {
  //           type: 'MultiLineString',
  //           coordinates: [
  //             [
  //               [7.894537999999998, 47.981930000000006],
  //               [7.894482671, 47.981945340500005],
  //               [7.894392268799999, 47.98195199400001],
  //               [7.888434003399999, 47.98328655930001],
  //               [7.8873968723, 47.983498817],
  //               [7.886385393900001, 47.9836801349],
  //               [7.8851871885, 47.9838780131],
  //               [7.882373915199998, 47.984289644],
  //               [7.873836640500001, 47.98557731410003],
  //               [7.872917242200001, 47.98569032190002],
  //               [7.872508594599999, 47.98572176320002],
  //               [7.8721352519, 47.985735777900004],
  //               [7.8717987358, 47.98573382219999],
  //               [7.871425916099998, 47.98571463420001],
  //               [7.870651262999998, 47.98562936459999],
  //               [7.8699244795, 47.98551130889999],
  //               [7.8680169196, 47.9851510046],
  //               [7.867579784999999, 47.98508312020002],
  //               [7.867137630000001, 47.98503192270002],
  //               [7.8665804854, 47.9849883894],
  //               [7.8655740448, 47.984933660000024],
  //               [7.862177052599998, 47.984796044999996],
  //               [7.8617316452, 47.9847599398],
  //               [7.8613300396, 47.984700814400014],
  //               [7.8608351884, 47.98458698770003],
  //               [7.860189496299999, 47.984388626400005],
  //               [7.854739395, 47.98250552779999],
  //               [7.854635631799999, 47.982501435399996],
  //             ],
  //           ],
  //         },
  //         properties: {
  //           condition_group: 'information',
  //           graph: 'np_topo15',
  //           is_icon_ref: true,
  //           reasons: [
  //             {
  //               category_name: 'Technische Probleme',
  //               name: 'Bauarbeiten',
  //             },
  //           ],
  //           severity_group: 'high',
  //         },
  //         type: 'Feature',
  //       },
  //       {
  //         geometry: {
  //           type: 'MultiLineString',
  //           coordinates: [
  //             [
  //               [7.781502999999999, 47.96371324649999],
  //               [7.781502999999999, 47.96371324649999],
  //             ],
  //           ],
  //         },
  //         properties: {
  //           condition_group: 'information',
  //           graph: 'np_topo4',
  //           is_icon_ref: true,
  //           reasons: [
  //             {
  //               category_name: 'Technische Probleme',
  //               name: 'Bauarbeiten',
  //             },
  //           ],
  //           severity_group: 'high',
  //         },
  //         type: 'Feature',
  //       },
  //       {
  //         geometry: {
  //           type: 'MultiLineString',
  //           coordinates: [
  //             [
  //               [7.781502999999999, 47.854713000000004],
  //               [7.781502999999999, 47.854713000000004],
  //             ],
  //             [
  //               [7.781502999999999, 47.854713000000004],
  //               [7.781502999999999, 47.854713000000004],
  //             ],
  //           ],
  //         },
  //         properties: {
  //           condition_group: 'information',
  //           graph: 'np_topo5',
  //           is_icon_ref: true,
  //           reasons: [
  //             {
  //               category_name: 'Technische Probleme',
  //               name: 'Bauarbeiten',
  //             },
  //           ],
  //           severity_group: 'high',
  //         },
  //         type: 'Feature',
  //       },
  //       {
  //         geometry: {
  //           type: 'MultiLineString',
  //           coordinates: [
  //             [
  //               [7.7873261532999996, 48.011336611100006],
  //               [7.7873261532999996, 48.011336611100006],
  //             ],
  //           ],
  //         },
  //         properties: {
  //           condition_group: 'information',
  //           graph: 'np_topo6',
  //           is_icon_ref: true,
  //           reasons: [
  //             {
  //               category_name: 'Technische Probleme',
  //               name: 'Bauarbeiten',
  //             },
  //           ],
  //           severity_group: 'high',
  //         },
  //         type: 'Feature',
  //       },
  //       {
  //         geometry: {
  //           type: 'MultiLineString',
  //           coordinates: [
  //             [
  //               [7.8404419999999995, 47.98699702869999],
  //               [7.8404419999999995, 47.98699702869999],
  //             ],
  //           ],
  //         },
  //         properties: {
  //           condition_group: 'information',
  //           graph: 'np_topo7',
  //           is_icon_ref: true,
  //           reasons: [
  //             {
  //               category_name: 'Technische Probleme',
  //               name: 'Bauarbeiten',
  //             },
  //           ],
  //           severity_group: 'high',
  //         },
  //         type: 'Feature',
  //       },
  //       {
  //         geometry: {
  //           type: 'MultiLineString',
  //           coordinates: [
  //             [
  //               [7.894537999999998, 47.981930000000006],
  //               [7.8891175855, 47.98555810800002],
  //               [7.885415762899999, 47.9875618824],
  //               [7.881272019899999, 47.98914163240002],
  //               [7.868761889199999, 47.99379036580001],
  //               [7.864553794299998, 47.99529074520001],
  //               [7.860028675999999, 47.99628098500003],
  //               [7.855294146, 47.99661600000002],
  //               [7.854815044499999, 47.99661600000002],
  //             ],
  //           ],
  //         },
  //         properties: {
  //           condition_group: 'information',
  //           graph: 'np_topo8',
  //           is_icon_ref: true,
  //           reasons: [
  //             {
  //               category_name: 'Technische Probleme',
  //               name: 'Bauarbeiten',
  //             },
  //           ],
  //           severity_group: 'high',
  //         },
  //         type: 'Feature',
  //       },
  //       {
  //         geometry: {
  //           type: 'MultiLineString',
  //           coordinates: [
  //             [
  //               [7.893964461699999, 47.98154609210002],
  //               [7.8892869734, 47.978415027199986],
  //               [7.887257826199999, 47.97771173470002],
  //               [7.884982173899999, 47.97789929220002],
  //               [7.8429559357, 47.98686118750001],
  //               [7.841133932099999, 47.987784115200014],
  //               [7.8404419999999995, 47.989241615700024],
  //               [7.8404419999999995, 47.9936686259],
  //             ],
  //           ],
  //         },
  //         properties: {
  //           condition_group: 'information',
  //           graph: 'np_topo9',
  //           is_icon_ref: true,
  //           reasons: [
  //             {
  //               category_name: 'Technische Probleme',
  //               name: 'Bauarbeiten',
  //             },
  //           ],
  //           severity_group: 'high',
  //         },
  //         type: 'Feature',
  //       },
  //       {
  //         geometry: {
  //           type: 'MultiLineString',
  //           coordinates: [
  //             [
  //               [7.8951595447, 47.98179000390002],
  //               [7.8885521999999995, 47.9832639],
  //               [7.887355399999999, 47.98350970000001],
  //               [7.886202699999999, 47.98371710000001],
  //               [7.8853988, 47.98384870000001],
  //               [7.883476900000001, 47.98412349999998],
  //               [7.873746999999998, 47.98559019999999],
  //               [7.873045599999999, 47.98568080000001],
  //               [7.8725915, 47.985720000000015],
  //               [7.872051699999998, 47.98573970000004],
  //               [7.871515399999999, 47.985724799999986],
  //               [7.870442899999999, 47.98560810000001],
  //               [7.868149, 47.985173100000026],
  //               [7.8675543, 47.98507119999999],
  //               [7.8672775, 47.98503550000004],
  //               [7.8657203, 47.9849385],
  //               [7.8627388, 47.984823800000015],
  //               [7.8618228000000006, 47.98477770000002],
  //               [7.861672600000001, 47.9847623],
  //               [7.861131799999999, 47.98467069999998],
  //               [7.8609517, 47.9846273],
  //               [7.8602710999999985, 47.98441940000001],
  //               [7.8595929, 47.984176099999985],
  //               [7.8585318, 47.98375960000001],
  //               [7.8549883, 47.98253150000002],
  //             ],
  //           ],
  //         },
  //         properties: {
  //           condition_group: 'information',
  //           graph: 'osm',
  //           is_icon_ref: true,
  //           reasons: [
  //             {
  //               category_name: 'Technische Probleme',
  //               name: 'Bauarbeiten',
  //             },
  //           ],
  //           severity_group: 'high',
  //         },
  //         type: 'Feature',
  //       },
  //       {
  //         geometry: {
  //           coordinates: [7.8932675903, 47.980540502099984],
  //           type: 'Point',
  //         },
  //         properties: {
  //           condition_group: 'information',
  //           graph: 'np_topo10',
  //           name: 'Freiburg-Littenweiler',
  //           reasons: [
  //             {
  //               category_name: 'Technische Probleme',
  //               name: 'Bauarbeiten',
  //             },
  //           ],
  //           severity_group: 'high',
  //         },
  //         type: 'Feature',
  //       },
  //       {
  //         geometry: {
  //           coordinates: [7.894194229599999, 47.98137446749999],
  //           type: 'Point',
  //         },
  //         properties: {
  //           condition_group: 'information',
  //           graph: 'np_topo11',
  //           name: 'Freiburg-Littenweiler',
  //           reasons: [
  //             {
  //               category_name: 'Technische Probleme',
  //               name: 'Bauarbeiten',
  //             },
  //           ],
  //           severity_group: 'high',
  //         },
  //         type: 'Feature',
  //       },
  //       {
  //         geometry: {
  //           coordinates: [7.894366114800001, 47.98165223449999],
  //           type: 'Point',
  //         },
  //         properties: {
  //           condition_group: 'information',
  //           graph: 'np_topo12',
  //           name: 'Freiburg-Littenweiler',
  //           reasons: [
  //             {
  //               category_name: 'Technische Probleme',
  //               name: 'Bauarbeiten',
  //             },
  //           ],
  //           severity_group: 'high',
  //         },
  //         type: 'Feature',
  //       },
  //       {
  //         geometry: {
  //           coordinates: [7.8944520574, 47.98179111740001],
  //           type: 'Point',
  //         },
  //         properties: {
  //           condition_group: 'information',
  //           graph: 'np_topo13',
  //           name: 'Freiburg-Littenweiler',
  //           reasons: [
  //             {
  //               category_name: 'Technische Probleme',
  //               name: 'Bauarbeiten',
  //             },
  //           ],
  //           severity_group: 'high',
  //         },
  //         type: 'Feature',
  //       },
  //       {
  //         geometry: {
  //           coordinates: [7.8944950287, 47.98186055880001],
  //           type: 'Point',
  //         },
  //         properties: {
  //           condition_group: 'information',
  //           graph: 'np_topo14',
  //           name: 'Freiburg-Littenweiler',
  //           reasons: [
  //             {
  //               category_name: 'Technische Probleme',
  //               name: 'Bauarbeiten',
  //             },
  //           ],
  //           severity_group: 'high',
  //         },
  //         type: 'Feature',
  //       },
  //       {
  //         geometry: {
  //           coordinates: [7.894537999999998, 47.981930000000006],
  //           type: 'Point',
  //         },
  //         properties: {
  //           condition_group: 'information',
  //           graph: 'np_topo15',
  //           name: 'Freiburg-Littenweiler',
  //           reasons: [
  //             {
  //               category_name: 'Technische Probleme',
  //               name: 'Bauarbeiten',
  //             },
  //           ],
  //           severity_group: 'high',
  //         },
  //         type: 'Feature',
  //       },
  //       {
  //         geometry: {
  //           coordinates: [7.781502999999999, 47.96371324649999],
  //           type: 'Point',
  //         },
  //         properties: {
  //           condition_group: 'information',
  //           graph: 'np_topo4',
  //           name: 'Freiburg-Littenweiler',
  //           reasons: [
  //             {
  //               category_name: 'Technische Probleme',
  //               name: 'Bauarbeiten',
  //             },
  //           ],
  //           severity_group: 'high',
  //         },
  //         type: 'Feature',
  //       },
  //       {
  //         geometry: {
  //           coordinates: [7.7503884574, 47.90509307830001],
  //           type: 'Point',
  //         },
  //         properties: {
  //           condition_group: 'information',
  //           graph: 'np_topo5',
  //           name: 'Freiburg-Littenweiler',
  //           reasons: [
  //             {
  //               category_name: 'Technische Probleme',
  //               name: 'Bauarbeiten',
  //             },
  //           ],
  //           severity_group: 'high',
  //         },
  //         type: 'Feature',
  //       },
  //       {
  //         geometry: {
  //           coordinates: [7.8404419999999995, 47.99661600000002],
  //           type: 'Point',
  //         },
  //         properties: {
  //           condition_group: 'information',
  //           graph: 'np_topo6',
  //           name: 'Freiburg-Littenweiler',
  //           reasons: [
  //             {
  //               category_name: 'Technische Probleme',
  //               name: 'Bauarbeiten',
  //             },
  //           ],
  //           severity_group: 'high',
  //         },
  //         type: 'Feature',
  //       },
  //       {
  //         geometry: {
  //           coordinates: [7.8404419999999995, 47.98699702869999],
  //           type: 'Point',
  //         },
  //         properties: {
  //           condition_group: 'information',
  //           graph: 'np_topo7',
  //           name: 'Freiburg-Littenweiler',
  //           reasons: [
  //             {
  //               category_name: 'Technische Probleme',
  //               name: 'Bauarbeiten',
  //             },
  //           ],
  //           severity_group: 'high',
  //         },
  //         type: 'Feature',
  //       },
  //       {
  //         geometry: {
  //           coordinates: [7.894537999999998, 47.981930000000006],
  //           type: 'Point',
  //         },
  //         properties: {
  //           condition_group: 'information',
  //           graph: 'np_topo8',
  //           name: 'Freiburg-Littenweiler',
  //           reasons: [
  //             {
  //               category_name: 'Technische Probleme',
  //               name: 'Bauarbeiten',
  //             },
  //           ],
  //           severity_group: 'high',
  //         },
  //         type: 'Feature',
  //       },
  //       {
  //         geometry: {
  //           coordinates: [7.893964461699999, 47.98154609210002],
  //           type: 'Point',
  //         },
  //         properties: {
  //           condition_group: 'information',
  //           graph: 'np_topo9',
  //           name: 'Freiburg-Littenweiler',
  //           reasons: [
  //             {
  //               category_name: 'Technische Probleme',
  //               name: 'Bauarbeiten',
  //             },
  //           ],
  //           severity_group: 'high',
  //         },
  //         type: 'Feature',
  //       },
  //       {
  //         geometry: {
  //           coordinates: [7.8951595447, 47.98179000390002],
  //           type: 'Point',
  //         },
  //         properties: {
  //           condition_group: 'information',
  //           graph: 'osm',
  //           name: 'Freiburg-Littenweiler',
  //           reasons: [
  //             {
  //               category_name: 'Technische Probleme',
  //               name: 'Bauarbeiten',
  //             },
  //           ],
  //           severity_group: 'high',
  //         },
  //         type: 'Feature',
  //       },
  //     ],
  //     properties: {
  //       id: '374725',
  //       title: 'Unterbruch zwischen Heuwaage und Brausebad',
  //       publicationStopNames: ['Freiburg-Littenweiler'],
  //       publicationLineNames: ['S1'],
  //       affectedTimeIntervalsStart: '2025-04-02T03:00:00+00:00',
  //       affectedTimeIntervalsEnd: '2500-12-31T00:00:00+00:00',
  //       publicationWindowsStart: '2025-03-30T08:00:00+00:00',
  //       publicationWindowsEnd: '2500-12-31T00:00:00+00:00',
  //       reasons: [
  //         {
  //           category_name: 'Technische Probleme',
  //           name: 'Bauarbeiten',
  //         },
  //       ],
  //       affectedTimeIntervals: [
  //         {
  //           id: '286746',
  //           startTime: '2025-04-02T03:00:00+00:00',
  //           endTime: '2500-12-31T00:00:00+00:00',
  //         },
  //       ],
  //       publicationWindows: [
  //         {
  //           id: '278866',
  //           startTime: '2025-03-30T08:00:00+00:00',
  //           endTime: '2500-12-31T00:00:00+00:00',
  //         },
  //       ],
  //       publications: [
  //         {
  //           visible_from: '2025-03-30T08:00:00+00:00',
  //           visible_until: '2500-12-31T00:00:00+00:00',
  //         },
  //       ],
  //       affected_time_intervals: [
  //         {
  //           end: '2500-12-31T00:00:00+00:00',
  //           start: '2025-04-02T03:00:00+00:00',
  //         },
  //       ],
  //     },
  //     type: 'FeatureCollection',
  //   },
  // ],
});

map.addLayer(mocoLayer);

const francfortExtent = buffer(
  [967387.0927876673, 6464738.161156644, 967387.0927876673, 6464738.161156644],
  100000,
);

const realtimeLayer = new RealtimeLayer({
  apiKey: window.apiKey,
  url: 'https://tralis-tracker-api.dev.geops.io/ws',
  // styleOptions: { useDelayStyle: true },
  // extent: francfortExtent,
  // graphByZoom: ['osm', 'osm', 'osm', 'osm', 'osm', 'osm', 'rvf'],
  // styleOptions: {
  //   delayDisplay: 0,
  //   // Define the circle color
  //   // @param {string} mot - The mode of transport
  //   // @param {object} line - The line object
  //   // @return {string} The color in rgba format
  //   getBgColor: (mot, line) => {
  //     if (mot === 'bus') {
  //       return 'rgba(0, 255, 0, 1)';
  //     }
  //     if (mot === 'subway') {
  //       return 'rgba(0, 0, 255, 1)';
  //     }
  //     // S-Bahn
  //     if (/^S/.test(line?.name)) {
  //       return 'rgba(0, 255, 255, 1)';
  //     }
  //     // Rail
  //     return 'rgba(255, 0, 0, 1)';
  //   },

  //   // Define the maximum radius of the circle when to display the stroke representing the delay
  //   // @param {string} mot - The mode of transport
  //   // @param {number} delay - The delay in seconds
  //   // @return {number} a radius in pixel
  //   getMaxRadiusForStrokeAndDelay: (mot, delay) => {
  //     return 7;
  //   },

  //   // Define the maximum radius of the circle when to display the text
  //   // @param {string} mot - The mode of transport
  //   // @param {number} zoom - The current zoom level
  //   // @return {number} a radius in pixel
  //   getMaxRadiusForText: (mot, zoom) => {
  //     return 6;
  //   },

  //   // Define the radius of the circle
  //   // @param {string} mot - The mode of transport
  //   // @param {number} zoom - The current zoom level
  //   // @return {number} a radius in pixel
  //   getRadius: (mot, zoom) => {
  //     return 7;
  //   },
  // },
  // filter: (traj) => {
  //   return traj.properties.state === 'JOURNEY_CANCELLED';
  // },
});
// map.addLayer(realtimeLayer);

map.addControl(new CopyrightControl());
map.on('moveend', () => {
  console.log('center: ', map.getView().getCenter());
  console.log('zoom: ', map.getView().getZoom());
  console.log('resolution: ', map.getView().getResolution());
});

// const routingLayer = new VectorLayer({
//   source: new VectorSource(),
//   style: routingStyle,
// });
// // map.addLayer(routingLayer);

// // const control = new RoutingControl({
// //   element: document.createElement('div'),
// //   apiKey: window.apiKey,
// //   routingLayer: routingLayer,
// // });
// // map.addControl(control);

// const vectorLayer = new VectorLayer({
//   source: new VectorSource(),
// });
// vectorLayer.getSource().addFeature(
//   new Feature({
//     geometry: new LineString([
//       // [950476.4055933182, 6003322.253698345],
//       // [950389.0813034325, 6003656.659274571],
//       // [
//       [950478.7985399539, 6003320.7265438335],
//       [950483.7500754321, 6003337.644331005],
//       [950518.7823191849, 6003431.357665203],
//       [950420.9547506756, 6003448.256090432],
//       [950349.999707244, 6003582.770702608],
//       [950351.0015826611, 6003608.825650063],
//       [950361.1427882726, 6003611.801014977],
//       [950368.5900622065, 6003616.61749184],
//       [950379.0986221373, 6003626.80936295],
//       [950388.2936120768, 6003641.22594949],
//       [950393.3361623707, 6003652.514778154],
//       // ]
//     ]),
//   }),
// );
// map.addLayer(vectorLayer);

// const modify = new Modify({
//   source: vectorLayer.getSource(),
//   hitDetection: vectorLayer,
// });
// map.addInteraction(modify);

// control.addViaPoint([950476.4055933182, 6003322.253698345]);
// control.addViaPoint([950389.0813034325, 6003656.659274571]);
// control.addViaPoint('29563461696e881d');

// Add example button to toggle the RoutingControl.
// document.getElementById('control-button').addEventListener('click', (e) => {
//   e.target.innerHTML = control.active
//     ? 'Activate RoutingControl'
//     : 'Deactivate RoutingControl';
//   if (control.active) {
//     control.active = false;
//   } else {
//     control.active = true;
//   }
// });

// // Add example button to toggle the RoutingControl mot.
// document.getElementById('mot-button').addEventListener('click', (e) => {
//   e.target.innerHTML =
//     control.mot === 'bus' ? 'Switch to bus routing' : 'Switch to foot routing';
//   control.mot = control.mot === 'bus' ? 'foot' : 'bus';
// });

// // Add example button to toggle the RoutingControl mot.
// document.getElementById('reset-button').addEventListener('click', () => {
//   control.reset();
// });

map.on('pointermove', (e) => {
  const feature = map.getFeaturesAtPixel(e.pixel)[0];
  realtimeLayer.highlight(feature);
});

map.on('singleclick', (e) => {
  const feature = map.getFeaturesAtPixel(e.pixel)[0];
  realtimeLayer.select(feature);
  console.log(feature);
});

let map2 = new Map({
  pixelRatio: 3,
  target: 'map2',
  view: new View({
    center: map.getView().getCenter(),
    zoom: map.getView().getZoom(),
  }),
});

map.once('rendercomplete', (e) => {
  console.log('map first rendercomplete');
  map.on('rendercomplete', (e) => {
    console.log('map first rendercomplete');
  });

  const metadata = baseLayer.mapLibreMap?.getStyle()?.metadata;
  console.log('baseLayer metadata: ', metadata);
  const graphByZoom = [];
  for (var i = 0; i < 26; i++) {
    graphByZoom.push(getGraphByZoom(i, metadata?.graphs));
  }
  realtimeLayer.engine.graphByZoom = graphByZoom;
  console.log('realtimeLayer.graphByZoom: ', realtimeLayer.engine.graphByZoom);
});

map2.once('rendercomplete', (e) => {
  console.log('map2 first rendercomplete');
  map2.on('rendercomplete', (e) => {
    console.log('map2 rendercomplete');
  });
});

document.getElementById('map2ToMap').onclick = () => {
  const layers = [...map2.getLayers().getArray()];
  map2.getLayers().clear();
  map.setLayers(layers);
  map.once('rendercomplete', (e) => {
    console.log('map1 rendercomplete');
  });
};

document.getElementById('mapToMap2').onclick = () => {
  const layers = [...map.getLayers().getArray()];
  map.getLayers().clear();
  map2.setLayers(layers);
  map2.once('rendercomplete', (e) => {
    console.log('map2 rendercomplete');
  });
};

document.getElementById('toggleMocoLayer').onclick = () => {
  if (map.getLayers().getArray().includes(mocoLayer)) {
    console.log('Removing MocoLayer');
    map.removeLayer(mocoLayer);
  } else {
    console.log('Add MocoLayer');
    map.addLayer(mocoLayer);
    mocoLayer.maplibreLayer?.mapLibreMap?.on('load', () => {
      console.log('MocoLayer mapLibreMap load event');
    });
    mocoLayer.maplibreLayer?.mapLibreMap?.on('idle', () => {
      console.log('MocoLayer mapLibreMap load event');
    });
    //mocoLayer.maplibreLayer?.mapLibreMap.redraw();
    window.mbMap = mocoLayer.maplibreLayer?.mapLibreMap;
    console.log(
      'Source data',
      mocoLayer.maplibreLayer?.mapLibreMap?.getSource('rvf_moco'),
    );
    console.log(
      'layer data',
      mocoLayer.maplibreLayer?.mapLibreMap,
      mocoLayer.maplibreLayer?.mapLibreMap.getLayer('moco-notification-line'),
    );
  }
};
