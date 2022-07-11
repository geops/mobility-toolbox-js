import { Map, View } from 'ol';
import {
  MaplibreLayer,
  CopyrightControl,
  realtimeDelayStyle,
  sortByDelay,
  Layer,
} from '../../../../src/ol';
import 'ol/ol.css';

export default () => {
  const map = new Map({
    target: 'map',
    view: new View({
      center: [831634, 5933959],
      zoom: 13,
    }),
    controls: [],
  });

  const baseTravic = new MaplibreLayer({
    url: `https://maps.geops.io/styles/travic_v2/style.json?key=${window.apiKey}`,
    group: 'baseLayer',
    name: 'Base - Travic',
    visible: false,
  });

  const baseDark = new MaplibreLayer({
    url: `https://maps.geops.io/styles/base_dark_v2/style.json?key=${window.apiKey}`,
    name: 'Base - Dark',
    key: 'basedark.baselayer',
    visible: true,
    group: 'baseLayer',
  });

  const baseBright = new MaplibreLayer({
    url: `https://maps.geops.io/styles/base_bright_v2/style.json?key=${window.apiKey}`,
    name: 'Base - Bright',
    visible: false,
    group: 'baseLayer',
  });
  const group = new Layer({
    name: 'Parent',
    children: [
      new Layer({
        name: 'Paren - Travix',
        visible: false,
        children: [baseTravic],
      }),
      new Layer({
        name: 'Paren - Dark',
        children: [baseDark],
      }),
      new Layer({
        name: 'Paren - Bright',
        visible: false,
        children: [baseBright],
      }),
    ],
  });
  group.attachToMap(map);

  // Add example button to toggle the RoutingControl mot.
  document.getElementById('baseTravic').addEventListener('click', (e) => {
    console.log('CLICK');
    baseTravic.visible = !baseTravic.visible;
    console.log(group.name, group.visible);
    group.children.forEach((layer) => {
      console.log(layer.name, layer.visible);
      layer.children.forEach((layerr) => {
        console.log(layerr.name, layerr.visible);
      });
    });
  });
  document.getElementById('baseBright').addEventListener('click', (e) => {
    console.log('CLICK');
    baseBright.visible = !baseBright.visible;
    console.log(group.name, group.visible);
    group.children.forEach((layer) => {
      console.log(layer.name, layer.visible);
      layer.children.forEach((layerr) => {
        console.log(layerr.name, layerr.visible);
      });
    });
  });
  document.getElementById('baseDark').addEventListener('click', (e) => {
    console.log('CLICK');
    baseDark.visible = !baseDark.visible;
    console.log(group.name, group.visible);
    group.children.forEach((layer) => {
      console.log(layer.name, layer.visible);
      layer.children.forEach((layerr) => {
        console.log(layerr.name, layerr.visible);
      });
    });
  });
};
