import { Vector } from 'ol/layer';
import { Circle, Stroke, Style, Fill } from 'ol/style';
import { Vector as VectorSource } from 'ol/source';
import { Feature } from 'ol';
import { LineString, Point, MultiPoint } from 'ol/geom';
import { Modify } from 'ol/interaction';
import { unByKey } from 'ol/Observable';
import EventType from 'ol/events/EventType';
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

const defaultStyle = [
  new Style({
    stroke: new Stroke({
      color: [255, 0, 0, 1],
      width: 5,
    }),
  }),
  new Style({
    image: new Circle({
      radius: 6,
      fill: new Fill({
        color: [255, 0, 0, 1],
      }),
    }),
    geometry: (feat) => {
      return new MultiPoint(feat.getGeometry().getCoordinates());
    },
  }),
];

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
        width: '20px',
        height: '20px',
        backgroundColor: 'black',
      });
    }
    super(opts);

    this.from = null;
    this.to = null;

    this.element.addEventListener(
      EventType.CLICK,
      () => this.setDrawEnabled(!this.active, true),
      false,
    );

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
            new Style({
              image: new Circle({
                radius: 6,
                fill: new Fill({
                  color: [255, 0, 0, 1],
                }),
              }),
              geometry: (feat) => {
                return new MultiPoint(feat.getGeometry().getCoordinates());
              },
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
      // Define and add modify interaction
      this.modify = new Modify({
        source: this.routingLayer.olLayer.getSource(),
        pixelTolerance: 4,
        style: defaultStyle,
      });

      this.modify.on('modifyend', (e) => {
        // Redefine and redraw viaPoints on modify end
        this.viaPoints = [];
        const coords = e.features
          .getArray()
          .filter((feat) => feat.getGeometry() instanceof LineString)[0]
          .getGeometry()
          .getCoordinates();
        this.viaPoints = coords;
        this.drawRoute(this.viaPoints);
      });

      if (this.active) {
        // Add control ressources to map
        this.map.addLayer(this.routingLayer);
        this.onMapClickKey = this.map.on('singleclick', (e) =>
          this.addViaPoint(e.coordinate),
        );
        this.map.addInteraction(this.modify);
        return;
      }

      // Remove control ressources from map
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
    // Clear source
    this.routingLayer.olLayer.getSource().clear();

    if (coordinateArray.length === 1) {
      // Add point for first node
      const pointFeature = new Feature({
        geometry: new Point(coordinateArray[0]),
      });
      pointFeature.setStyle(defaultPointStyle);
      return this.routingLayer.olLayer.getSource().addFeature(pointFeature);
    }
    if (coordinateArray.length >= 2) {
      // Add line once there are two viaPoints
      const routeFeature = new Feature({
        geometry: new LineString(coordinateArray),
      });
      return this.routingLayer.olLayer.getSource().addFeature(routeFeature);
    }
    return null;
  }
}

export default RoutingControl;
