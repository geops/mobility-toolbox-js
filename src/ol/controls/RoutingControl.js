import { Vector } from 'ol/layer';
import { Circle, Stroke, Style, Fill } from 'ol/style';
import { Vector as VectorSource } from 'ol/source';
import { Feature } from 'ol';
import { LineString, Point } from 'ol/geom';
import { Modify } from 'ol/interaction';
import { unByKey } from 'ol/Observable';
import EventType from 'ol/events/EventType';
import { fromLonLat, toLonLat } from 'ol/proj';
import { never } from 'ol/events/condition';
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

// const defaultStyle = [
//   new Style({
//     stroke: new Stroke({
//       color: [255, 0, 0, 1],
//       width: 5,
//     }),
//   }),
//   new Style({
//     image: new Circle({
//       radius: 6,
//       fill: new Fill({
//         color: [255, 0, 0, 1],
//       }),
//     }),
//     geometry: (feat) => {
//       return new MultiPoint(feat.getGeometry().getCoordinates());
//     },
//   }),
// ];

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

    // ##########################
    this.fakeLayer = new Layer({
      name: 'falke-layer',
      olLayer: new Vector({
        source: new VectorSource(),
      }),
    });
    // ##########################
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
      // ######################
      this.fakeLayer.olLayer.getSource().clear();
      // ######################
    }

    if (this.map) {
      // Define and add modify interaction
      this.modify = new Modify({
        source: this.routingLayer.olLayer.getSource(),
        pixelTolerance: 4,
        insertVertexCondition: never,
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
          oldRoute: route.clone(),
          coordinate: e.mapBrowserEvent.coordinate,
        };

        // this.routingLayer.olLayer.getSource().removeFeature(route);
        // ######################
        this.fakeLayer.olLayer.getSource().clear();
        // ######################
      });

      this.modify.on('modifyend', (e) => {
        // Get the index for new viaPoint
        const { oldRoute } = this.initialRouteDrag;

        if (!oldRoute) {
          return this.addViaPoint(e.mapBrowserEvent.coordinate, 0, 1);
        }

        // const closest = nearestPointOnLine(
        //   createTurfLine(oldRoute.getGeometry().getCoordinates()),
        //   createTurfPoint(this.initialRouteDrag.coordinate),
        // );
        const closest = oldRoute
          .getGeometry()
          .getClosestPoint(this.initialRouteDrag.coordinate);

        // ######################
        const olpoint = new Feature({
          geometry: new Point(closest),
        });
        olpoint.setStyle(
          new Style({
            image: new Circle({
              radius: 15,
              fill: new Fill({
                color: 'green',
              }),
            }),
          }),
        );

        this.fakeLayer.olLayer.getSource().addFeature(olpoint);
        // ######################

        const viaPointClosestPoints = this.viaPoints.map((viaPoint) => {
          const snapPoint = oldRoute.getGeometry().getClosestPoint(viaPoint);
          // ######################
          const snapolpoint = new Feature({
            geometry: new Point(snapPoint),
          });
          snapolpoint.setStyle(
            new Style({
              image: new Circle({
                radius: 8,
                fill: new Fill({
                  color: 'orange',
                }),
              }),
            }),
          );

          this.fakeLayer.olLayer.getSource().addFeature(snapolpoint);
          // ######################
          return snapPoint;
        });

        const segments = [];
        for (let i = 0; i < viaPointClosestPoints.length - 1; i += 1) {
          const lineSegment = lineSlice(
            createTurfPoint(viaPointClosestPoints[i]),
            createTurfPoint(viaPointClosestPoints[i + 1]),
            createTurfLine(oldRoute.getGeometry().getCoordinates()),
          );
          const segment = new LineString(lineSegment.geometry.coordinates);
          const distanceToClick = getDistance(
            segment.getClosestPoint(closest),
            closest,
          );
          segments.push({
            lineSegment: segment,
            distanceToClick,
            index: i + 1,
          });
        }
        // ######################
        segments.forEach((segment) => {
          const olRoute = new Feature({
            geometry: segment.lineSegment,
          });
          olRoute.setStyle(
            new Style({
              stroke: new Stroke({
                color: 'blue',
                width: 7,
              }),
            }),
          );
          this.fakeLayer.olLayer.getSource().addFeature(olRoute);
          // if (segment.distanceToClick > segmentDistance) {
          //   newViaIndex = segment.index;
          // }
        });
        // ######################

        const closestSegment = segments.reduce((prev, current) =>
          prev.distanceToClick < current.distanceToClick ? prev : current,
        );

        return this.addViaPoint(
          e.mapBrowserEvent.coordinate,
          closestSegment.index,
        );
      });

      if (this.active) {
        // Add control ressources to map
        // ######################
        // this.map.addLayer(this.fakeLayer);
        // ######################
        this.map.addLayer(this.routingLayer);
        this.onMapClickKey = this.map.on('singleclick', (e) => {
          const feats = e.target.getFeaturesAtPixel(e.pixel, {
            hitTolerance: 5,
          });
          if (feats[0] && feats[0].get('index')) {
            this.removeViaPoint(feats[0].get('index'));
          }

          this.addViaPoint(e.coordinate);
        });
        this.map.addInteraction(this.modify);
        return;
      }

      // Remove control ressources from map
      // ######################
      // this.map.removeLayer(this.fakeLayer.olLayer);
      // ######################
      this.map.removeLayer(this.routingLayer.olLayer);
      this.map.removeInteraction(this.modify);
      unByKey(this.onMapClickKey);
    }
  }

  addViaPoint(coordinate, index = this.viaPoints.length, overwrite = 0) {
    // Add/Insert/Overwrite viapoint and redraw route
    this.viaPoints.splice(index, overwrite, coordinate);
    this.drawRoute(this.viaPoints);
  }

  removeViaPoint(index = this.viaPoints.length - 1) {
    // Remove viapoint and redraw route
    if (this.viaPoints.length && this.viaPoints[index]) {
      this.viaPoints.splice(index, 1);
    }
    this.drawRoute(this.viaPoints);
  }

  getViaPoints() {
    return this.viaPoints;
  }

  drawRoute(coordinateArray) {
    if (coordinateArray.length === 1) {
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
