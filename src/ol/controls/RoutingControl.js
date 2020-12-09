import { Vector } from 'ol/layer';
import { Circle, Stroke, Style, Fill } from 'ol/style';
import { Vector as VectorSource } from 'ol/source';
import { Feature } from 'ol';
import { LineString, Point } from 'ol/geom';
import { Modify } from 'ol/interaction';
import { unByKey } from 'ol/Observable';
import EventType from 'ol/events/EventType';
import { click } from 'ol/events/condition';

import { fromLonLat, toLonLat } from 'ol/proj';
import lineSlice from '@turf/line-slice';
import { getDistance } from 'ol/sphere';
import {
  lineString as createTurfLine,
  point as createTurfPoint,
} from '@turf/helpers';
import RoutingAPI from '../../api/routing/RoutingAPI';
import Control from '../../common/controls/Control';
import Layer from '../layers/Layer';

const defaultPointStyle = new Style({
  image: new Circle({
    radius: 6,
    fill: new Fill({
      color: [255, 0, 0, 1],
    }),
  }),
});

/**
 * Display layer's copyrights.
 *
 * @example
 * import { Map, RoutingControl } from 'mobility-toolbox-js/ol';
 *
 * const map = new Map({
 *   target: 'map',
 *   controls: [
 *     new RoutingControl()
 *   ]
 * });
 *
 *
 * @see <a href="/example/ol-routing">Openlayers routing example</a>
 *
 * @extends {Control}
 * @implements {RoutingInterface}
 */
class RoutingControl extends Control {
  constructor(options) {
    const opts = {
      ...options,
    };

    if (!opts.element) {
      /**
       * Define a default element.
       */
      opts.element = document.createElement('button');
      opts.element.id = 'ol-routing';
      Object.assign(opts.element.style, {
        position: 'absolute',
        right: '10px',
        top: '10px',
        width: '40px',
        height: '20px',
      });
    }
    super(opts);

    this.element.addEventListener(
      EventType.CLICK,
      () => this.setDrawEnabled(!this.active, true),
      false,
    );

    this.abortController = new AbortController();

    this.api = new RoutingAPI({
      apiKey: '5cc87b12d7c5370001c1d655012b7edc8da1475084e49b84b6ba658e',
    });

    this.mot = 'foot';

    this.routingLayer =
      opts.layer ||
      new Layer({
        name: 'routing-layer',
        olLayer: new Vector({
          source: new VectorSource(),
          style: [
            new Style({
              stroke: new Stroke({
                color: [255, 0, 0, 1],
                width: 5,
              }),
            }),
          ],
        }),
      });

    this.viaPoints = [];

    this.setDrawEnabled(opts.active);
  }

  setDrawEnabled(enabled, reset) {
    this.active = enabled;

    // Clear viaPoints and source
    if (reset) {
      this.viaPoints = [];
      this.routingLayer.olLayer.getSource().clear();
    }

    if (this.map) {
      if (!this.active) {
        // Remove control ressources from map
        this.map.removeLayer(this.routingLayer.olLayer);
        this.map.removeInteraction(this.modify);
        unByKey(this.onMapClickKey);
        return;
      }

      // Define and add modify interaction
      this.modify = new Modify({
        source: this.routingLayer.olLayer.getSource(),
        pixelTolerance: 4,
        deleteCondition: (e) => {
          const feats = e.target.getFeaturesAtPixel(e.pixel, {
            hitTolerance: 5,
          });
          const viaPoint = feats.find(
            (feat) => feat.getGeometry() instanceof Point && feat.get('index'),
          );
          if (click(e) && viaPoint) {
            this.removeViaPoint(viaPoint.get('index'));
            return true;
          }
          return false;
        },
      });

      this.modify.on('modifystart', (e) => {
        const route = e.features
          .getArray()
          .find((feat) => feat.getGeometry() instanceof LineString);

        const viaPoints = e.features
          .getArray()
          .filter((feat) => feat.getGeometry() instanceof Point);

        this.initialRouteDrag = {
          viaPoints,
          oldRoute: route && route.clone(),
          coordinate: e.mapBrowserEvent.coordinate,
        };
      });

      this.modify.on('modifyend', (e) => {
        /* Get the index for new viaPoint */
        let newViaIndex;
        const { oldRoute } = this.initialRouteDrag;

        if (!oldRoute) {
          return this.addViaPoint(e.mapBrowserEvent.coordinate, 0, 1);
        }

        // Get the closest point from viaPoints to original route
        const viaPointClosestPoints = this.viaPoints.map((viaPoint) => {
          const snapPoint = oldRoute.getGeometry().getClosestPoint(viaPoint);
          return snapPoint;
        });

        // Calculate the distance from the click point to each segment
        let distanceToSegment;
        for (let i = 0; i < viaPointClosestPoints.length - 1; i += 1) {
          // Create a segment for each pair of (closest) viaPoints using turf lineSlice
          const turfLineSegment = lineSlice(
            createTurfPoint(viaPointClosestPoints[i]),
            createTurfPoint(viaPointClosestPoints[i + 1]),
            createTurfLine(oldRoute.getGeometry().getCoordinates()),
          );

          /* Create an ol LineString from segment and get the distance between
           * the click point and the closest point on segment
           */
          const segment = new LineString(turfLineSegment.geometry.coordinates);
          const distanceToClick = getDistance(
            segment.getClosestPoint(this.initialRouteDrag.coordinate),
            this.initialRouteDrag.coordinate,
          );

          // Return segment index with smallest distance to click point
          if (!distanceToSegment || distanceToClick < distanceToSegment) {
            distanceToSegment = distanceToClick;
            newViaIndex = i + 1;
          }
        }

        // Insert new viaPoint at given index
        return this.addViaPoint(e.mapBrowserEvent.coordinate, newViaIndex);
      });

      // Add control ressources to map
      this.map.addLayer(this.routingLayer);
      this.onMapClickKey = this.map.on('singleclick', (e) => {
        const feats = e.target.getFeaturesAtPixel(e.pixel);
        const viaPoint = feats.find(
          (feat) =>
            feat.getGeometry() instanceof Point &&
            feat.get('index') !== undefined,
        );

        if (viaPoint) {
          // Remove existing viaPoint on click and abort viaPoint add
          this.removeViaPoint(viaPoint.get('index'));
          return;
        }

        this.addViaPoint(e.coordinate);
      });
      this.map.addInteraction(this.modify);
    }
  }

  addViaPoint(coordinate, index = this.viaPoints.length, overwrite = 0) {
    /* Add/Insert/Overwrite viapoint and redraw route */
    this.viaPoints.splice(index, overwrite, coordinate);
    this.drawRoute(this.viaPoints);
  }

  removeViaPoint(index = this.viaPoints.length - 1) {
    /* Remove viapoint and redraw route */
    if (this.viaPoints.length && this.viaPoints[index]) {
      this.viaPoints.splice(index, 1);
    }
    this.drawRoute(this.viaPoints);
  }

  getViaPoints() {
    /* Return array of viaPoints */
    return this.viaPoints;
  }

  setMot(motString) {
    /* Return array of viaPoints */
    this.mot = motString;
    this.drawRoute(this.viaPoints);
  }

  drawRoute(coordinateArray) {
    /* Calls RoutingAPI to draw a route using the viaPoints array */
    if (coordinateArray.length === 1) {
      // Clear source
      this.routingLayer.olLayer.getSource().clear();
      // Add point for first node
      const pointFeature = new Feature({
        geometry: new Point(coordinateArray[0]),
      });
      pointFeature.setStyle(defaultPointStyle);
      return this.routingLayer.olLayer.getSource().addFeature(pointFeature);
    }
    if (coordinateArray.length >= 2) {
      this.abortController.abort();
      this.abortController = new AbortController();
      const { signal } = this.abortController;

      const viasLonLat = this.viaPoints.map((coord) => [
        toLonLat(coord)[1],
        toLonLat(coord)[0],
      ]);

      this.api
        .route(
          {
            via: `${viasLonLat.join('|')}`,
            mot: `${this.mot}`,
            'resolve-hops': false,
            elevation: false,
            'coord-radius': 100.0,
            'coord-punish': 1000.0,
          },
          signal,
        )
        .then((data) => {
          // Clear source
          this.routingLayer.olLayer.getSource().clear();

          // Create point features for the viaPoints
          this.viaPoints.forEach((viaPoint, idx) => {
            const pointFeature = new Feature({
              geometry: new Point(viaPoint),
            });
            pointFeature.set('index', idx);
            pointFeature.setStyle(defaultPointStyle);
            return this.routingLayer.olLayer
              .getSource()
              .addFeature(pointFeature);
          });

          // Create new route once there are at least two viaPoints
          const projectedCoords = [];
          data.forEach((feature) =>
            feature.geometry.coordinates.forEach((coord) =>
              projectedCoords.push(fromLonLat(coord)),
            ),
          );
          const routeFeature = new Feature({
            geometry: new LineString(projectedCoords),
          });
          return this.routingLayer.olLayer.getSource().addFeature(routeFeature);
        });
    }
    return null;
  }
}

export default RoutingControl;
