import { Map, View } from 'ol';
import { RealtimeLayer, MaplibreLayer } from 'mobility-toolbox-js/ol';
import 'ol/ol.css';

import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import LineString from 'ol/geom/LineString';
import { toLonLat, transformExtent } from 'ol/proj';
import { Icon, Style, Circle, Fill, Stroke } from 'ol/style';
import { Point } from 'ol/geom';
import { radiansToDegrees } from '@turf/helpers';

export default () => {
  const getPointOnLine = (angleDeg, distance, originX = 0, originY = 0) => {
    // 1. Convert angle from degrees to radians
    const angleRad = (angleDeg + 90) * (Math.PI / 180);

    // 2. Calculate the offset from the origin using Cosine (X) and Sine (Y)
    const deltaX = Math.cos(angleRad) * distance;
    const deltaY = Math.sin(angleRad) * distance;

    // 3. Add the offset to the origin coordinates
    const x = originX + deltaX;
    const y = originY - deltaY;

    return [
      Math.floor(x), // Rounded for better readability
      Math.floor(y),
    ];
  };

  // Creates the background layer
  const layer = new MaplibreLayer({
    apiKey: window.apiKey,
  });

  // Creates the Realtime layer
  const realtimeLayer = new RealtimeLayer({
    apiKey: window.apiKey,
    styleOptions: {
      showHeading: true,
    },
    tenant: 'trenord',
  });
  const cacheFirtsAnchor = [];
  let cacheFirstRotation = 0;
  let featuresHighlightedIds = [];
  const realtimeLayerHover = new VectorLayer({
    source: new VectorSource(),
    minZoom: 14,
    style: (feature) => {
      // const canvas =
      //   realtimeLayer.engine.renderState?.styleCacheByTrajectoryId?.[
      //     feature.get('train_id')
      //   ];
      const canvas = realtimeLayer.style(
        {
          type: 'Feature',
          properties: feature.getProperties(),
          geometry: {
            type: 'LineString',
            coordinates: feature.getGeometry()?.getCoordinates() || [],
          },
        },
        realtimeLayer.renderedViewState,
        {
          ...realtimeLayer.styleOptions,
          showDelayText: false,
          showDelayBg: true,
          hoverVehicleId: feature.get('train_id'),
        },
      );
      const index = featuresHighlightedIds?.indexOf(feature.get('train_id'));
      console.log('index', index, feature.get('train_id'));
      if (index === 0) {
        cacheFirstRotation = feature.get('rotation') || 0;
      }

      if (canvas) {
        return new Style({
          image: new Icon({
            img: canvas,
            imgSize: [canvas.width, canvas.height],
            scale: 1,
            anchor: getPointOnLine(
              radiansToDegrees(cacheFirstRotation),
              (index * canvas.height) / 2,
              canvas.width / 2,
              canvas.height / 2,
            ),
            anchorXUnits: 'pixels',
            anchorYUnits: 'pixels',
          }),
          geometry: (feature) => {
            const coords = feature.get('coordinate');
            if (coords) {
              return new Point(coords);
            }
            return feature.getGeometry();
          },
        });
      }
      return new Style({
        image: new Circle({
          radius: 50,
          fill: new Fill({ color: 'rgba(255, 0, 0, 0.5)' }),
          stroke: new Stroke({ color: 'red', width: 2 }),
        }),
        stroke: new Stroke({ color: 'blue', width: 20 }),
        geometry: (feature) => {
          const coords = feature.get('coordinate');
          if (coords) {
            return new Point(coords);
          }
          return feature.getGeometry();
        },
      });
    },
  });

  // Creates the map
  const map = new Map({
    target: 'map',
    layers: [layer, realtimeLayer, realtimeLayerHover],
    view: new View({
      //center: [831634, 5933959],
      center: [1022769, 5698188],
      zoom: 14.5,
      minZoom: 5,
    }),
  });

  // Defines options for vehicle detection on hover and on click
  const queryOptions = {
    hitTolerance: 5,
    layerFilter: (layer) => layer === realtime,
  };

  // Change mouse cursor and highlight vehicle if clickable
  map.on('pointermove', (evt) => {
    const pixel = map.getEventPixel(evt.originalEvent);
    const features = map.getFeaturesAtPixel(pixel, {
      hitTolerance: 15,
      layerFilter: (l) => l === realtimeLayer,
    });

    const featuresHovered = map.getFeaturesAtPixel(pixel, {
      layerFilter: (l) => l === realtimeLayerHover,
    });
    console.log(features.map((f) => f.get('train_id')));

    const featuresIds = features.map((f) => f.get('train_id'));
    const featuresHoveredIds = featuresHovered.map((f) => f.get('train_id'));
    const noFeaturesHovered =
      !featuresHovered.length && !featuresHoveredIds.length;

    if ((map.getView().getZoom() || 0) >= realtimeLayerHover.getMinZoom()) {
      realtimeLayer.filter = (feature) => {
        return !featuresHighlightedIds?.includes(feature.properties.train_id);
      };
    } else {
      realtimeLayer.filter = null;
    }

    console.log(
      'BEFORE features',
      featuresHovered.length,
      features.length,
      featuresHighlightedIds.length,
    );

    if (!featuresHovered.length && !features.length) {
      console.log('CLEAR features', featuresHovered.length, features.length);
      realtimeLayerHover.getSource().clear(true);
      featuresHighlightedIds = [];
    } else if (features.length > 1 && !featuresHighlightedIds.length) {
      console.log(
        'ADD features',
        featuresHoveredIds,
        featuresHovered.length,
        features.length,
        featuresIds,
      );
      realtimeLayerHover.getSource().addFeatures(features);
      featuresHighlightedIds = featuresIds;
    } else if (!featuresHovered.length && features.length === 1) {
      realtimeLayer.highlight(features[0]);
    }

    map.getTargetElement().style.cursor =
      features.length || featuresHovered.length ? 'pointer' : '';
  });

  // Display vehicle informations on click.
  map.on('singleclick', (evt) => {
    if (evt.dragging) {
      return;
    }
    const pixel = map.getEventPixel(evt.originalEvent);
    const [feature] = map.getFeaturesAtPixel(pixel, {
      hitTolerance: 15,
      layerFilter: (l) => l === realtimeLayer,
    });
    const [featureHover] = map.getFeaturesAtPixel(pixel, {
      hitTolerance: 15,
      layerFilter: (l) => l === realtimeLayerHover,
    });

    realtimeLayer.select(featureHover || feature);
    realtimeLayerHover.getSource().clear();
    realtimeLayerHover.changed();
    realtimeLayer.filter = null;

    // Display the realtime feature informations
    document.getElementById('content').innerHTML = feature
      ? JSON.stringify(feature.getProperties(), null, 2)
      : 'No vehicle found';
  });
};
