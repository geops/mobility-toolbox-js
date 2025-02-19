import maplibregl from 'maplibre-gl';
import * as ol from 'ol';
import * as control from 'ol/control';
import * as interaction from 'ol/interaction';
import * as layer from 'ol/layer';
import * as source from 'ol/source';

import mbt from './index';
if (typeof window !== 'undefined') {
  window.mbt = mbt;
  window.ol = ol;
  window.ol.layer = layer;
  window.ol.control = control;
  window.ol.interaction = interaction;
  window.ol.source = source;
  window.maplibregl = maplibregl;
}
export default mbt;
