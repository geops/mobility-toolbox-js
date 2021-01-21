import { Feature } from 'ol';
import { LineString, Point } from 'ol/geom';
import { Modify } from 'ol/interaction';
import { unByKey } from 'ol/Observable';
import { click } from 'ol/events/condition';
import { fromLonLat, toLonLat } from 'ol/proj';
import turfLineSlice from '@turf/line-slice';
import { getDistance } from 'ol/sphere';
import {
  lineString as turfLineString,
  point as turfPoint,
} from '@turf/helpers';
import RoutingAPI from '../../api/routing/RoutingAPI';
import Control from '../../common/controls/Control';
import RoutingLayer from '../layers/RoutingLayer';

/**
 * Display a route of a specified mean of transport.
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
 * @classproperty {string} apiKey - Key used for RoutingApi requests.
 * @classproperty {string} stopsApiKey - Key used for Stop lookup requests (defaults to apiKey).
 * @classproperty {string} stopsApiUrl - Url used for Stop lookup requests (defaults to https://api.geops.io/stops/v1/lookup/).
 * @classproperty {string} mot - Mean of transport to be used for routing.
 * @classproperty {RoutingLayer|Layer} routingLayer - Layer for adding route features.
 * @classproperty {function} onRouteError - Callback on error.
 * @see <a href="/example/ol-routing">Openlayers routing example</a>
 *
 * @extends {Control}
 * @implements {RoutingInterface}
 */
class RoutingControl extends Control {
  constructor(options = {}) {
    super(options);

    Object.defineProperties(this, {
      mot: {
        get: () => {
          return this.get('mot');
        },
        set: (newMot) => {
          if (newMot) {
            this.set('mot', newMot);
            if (this.viaPoints) {
              this.drawRoute();
            }
          }
        },
      },
      loading: {
        get: () => {
          return this.get('loading');
        },
        set: (newLoading) => {
          this.set('loading', newLoading);
        },
      },
    });

    /** @ignore */
    this.mot = options.mot || 'bus';

    this.abortController = new AbortController();

    /** @ignore */
    this.apiKey = options.apiKey;

    /** @ignore */
    this.stopsApiKey = options.stopsApiKey || this.apiKey;

    /** @ignore */
    this.stopsApiUrl =
      options.stopsApiUrl || 'https://api.geops.io/stops/v1/lookup/';

    this.api = new RoutingAPI({
      url: options.url,
      apiKey: this.apiKey,
      mot: options.mot,
    });

    /** @ignore */
    this.routingLayer =
      options.routingLayer ||
      new RoutingLayer({
        name: 'routing-layer',
      });

    /** @ignore */
    this.onRouteError =
      options.onRouteError ||
      ((error) => {
        this.dispatchEvent({
          type: 'change:route',
          target: this,
        });
        this.reset();
        // eslint-disable-next-line no-console
        console.error(error);
      });

    this.viaPoints = [];
    this.onMapClick = this.onMapClick.bind(this);
    this.onModifyEnd = this.onModifyEnd.bind(this);
    this.onModifyStart = this.onModifyStart.bind(this);
    this.apiChangeListener = () => this.drawRoute();
    this.createModifyInteraction();
  }

  /**
   * Adds/Replaces a viaPoint to the viaPoints array and redraws route:
   *   Adds a viaPoint at end of array by default.
   *   If an index is passed a viaPoint is added at the specified index.
   *   If an index is passed and overwrite x is > 0, x viaPoints at the specified
   *     index are replaced with a single new viaPoint.
   * @param {Array<number>} coordinates Array of coordinates
   * @param {number} index Integer representing the index of the added viaPoint.
   * @param {number} [overwrite=0] Marks the number of viaPoints that are removed at the specified index on add.
   */
  addViaPoint(coordinates, index = this.viaPoints.length, overwrite = 0) {
    /* Add/Insert/Overwrite viapoint and redraw route */
    this.viaPoints.splice(index, overwrite, coordinates);
    this.drawRoute();
    this.dispatchEvent({
      type: 'change:route',
      target: this,
    });
  }

  /**
   * Removes a viaPoint at the passed array index and redraws route
   * By default the last viaPoint is removed.
   * @param {number} index Integer representing the index of the viaPoint to delete.
   */
  removeViaPoint(index = this.viaPoints.length - 1) {
    /* Remove viapoint and redraw route */
    if (this.viaPoints.length && this.viaPoints[index]) {
      this.viaPoints.splice(index, 1);
    }
    this.drawRoute();
    this.dispatchEvent({
      type: 'change:route',
      target: this,
    });
  }

  /**
   * Replaces the current viaPoints with a new coordinate array.
   * @param {Array<Array<number>>} coordinateArray Array of nested coordinates
   */
  setViaPoints(coordinateArray) {
    this.viaPoints = [...coordinateArray];
    this.drawRoute();
    this.dispatchEvent({
      type: 'change:route',
      target: this,
    });
  }

  /**
   * Removes all viaPoints, clears the source and triggers a change event
   */
  reset() {
    // Clear viaPoints and source
    this.viaPoints = [];
    this.routingLayer.olLayer.getSource().clear();
    this.dispatchEvent({
      type: 'change:route',
      target: this,
    });
  }

  /**
   * Draws route on map using an array of coordinates:
   *   If a single coordinate is passed a single point feature is added to map.
   *   If two or more coordinates are passed a request to the RoutingAPI fetches
   *       the route using the passed coordinates and the current mot.
   * @private
   */
  drawRoute() {
    /* Calls RoutingAPI to draw a route using the viaPoints array */
    if (this.viaPoints.length === 1) {
      // Clear source
      this.routingLayer.olLayer.getSource().clear();
      // Add point for first node
      return this.drawViaPoint(this.viaPoints[0], 0);
    }
    if (this.viaPoints.length >= 2) {
      this.abortController.abort();
      this.abortController = new AbortController();

      const formattedViaPoints = this.viaPoints.map((viaPoint) => {
        if (Array.isArray(viaPoint)) {
          // viaPoint is a coordinate
          // Coordinates need to be reversed as required by the backend RoutingAPI
          return [toLonLat(viaPoint)[1], toLonLat(viaPoint)[0]];
        }
        // viaPoint is a UID
        return `!${viaPoint}`;
      });

      this.loading = true;

      // Fetch RoutingAPI data
      return this.api
        .route(
          {
            via: `${formattedViaPoints.join('|')}`,
            mot: `${this.mot}`,
            'resolve-hops': false,
            elevation: false,
            'coord-radius': 100.0,
            'coord-punish': 1000.0,
          },
          this.abortController,
        )
        .then((data) => {
          // Clear source
          this.routingLayer.olLayer.getSource().clear();

          // Create point features for the viaPoints
          this.viaPoints.forEach((viaPoint, idx) => {
            return this.drawViaPoint(viaPoint, idx);
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
          routeFeature.set('mot', this.mot);
          this.routingLayer.olLayer.getSource().addFeature(routeFeature);
          this.loading = false;
        })
        .catch((error) => {
          if (error.name === 'AbortError') {
            // Ignore abort error
            return;
          }
          // Dispatch error event and execute error function
          this.dispatchEvent({
            type: 'error',
            target: this,
          });
          this.onRouteError(error, this);
          this.loading = false;
        });
    }
    return null;
  }

  drawViaPoint(viaPoint, idx) {
    const pointFeature = new Feature();
    pointFeature.set('viaPointIdx', idx);
    if (Array.isArray(viaPoint)) {
      pointFeature.setGeometry(new Point(viaPoint));
      return this.routingLayer.olLayer.getSource().addFeature(pointFeature);
    }
    return fetch(
      `${this.stopsApiUrl}${viaPoint.split('$')[0]}?key=${this.stopsApiKey}`,
    )
      .then((res) => res.json())
      .then((stationData) => {
        const { coordinates } = stationData.features[0].geometry;
        pointFeature.setGeometry(new Point(fromLonLat(coordinates)));
        this.routingLayer.olLayer.getSource().addFeature(pointFeature);
      })
      .catch((error) => {
        // Dispatch error event and execute error function
        this.dispatchEvent({
          type: 'error',
          target: this,
        });
        this.onRouteError(error, this);
        this.loading = false;
      });
  }

  /**
   * Used on click on map while control is active:
   *   By default adds a viaPoint to the end of array.
   *   If an existing viaPoint is clicked removes the clicked viaPoint.
   * @private
   */
  onMapClick(e) {
    const feats = e.target.getFeaturesAtPixel(e.pixel);
    const viaPoint = feats.find(
      (feat) =>
        feat.getGeometry() instanceof Point &&
        feat.get('viaPointIdx') !== undefined,
    );

    if (viaPoint) {
      // Remove existing viaPoint on click and abort viaPoint add
      this.removeViaPoint(viaPoint.get('viaPointIdx'));
      return;
    }

    this.addViaPoint(e.coordinate);
  }

  /**
   * Used on start of the modify interaction. Stores relevant data
   * in this.initialRouteDrag object
   * @private
   */
  onModifyStart(e) {
    // Create instances for LineString and Point features
    const route = e.features
      .getArray()
      .find((feat) => feat.getGeometry() instanceof LineString);

    const viaPointFeatures = e.features
      .getArray()
      .filter((feat) => feat.getGeometry() instanceof Point);

    // Add listeners to viaPoint features to identify which one is being modified
    this.relocateViaPoint = (evt) => {
      this.initialRouteDrag.relocateViaPoint = evt.target;
    };

    viaPointFeatures.forEach((feature) => {
      feature.on('change', this.relocateViaPoint);
    });

    // Write object with modify info
    this.initialRouteDrag = {
      viaPointFeatures,
      oldRoute: route && route.clone(),
      coordinate: e.mapBrowserEvent.coordinate,
    };
  }

  /**
   * Used on end of the modify interaction. Resolves feature modification:
   *   Line drag creates new viaPoint at the final coordinate of drag.
   *   Point drag replaces old viaPoint.
   * @private
   */
  onModifyEnd(e) {
    /* Get the index for new viaPoint */
    let newViaIndex;
    const {
      oldRoute,
      relocateViaPoint,
      viaPointFeatures,
    } = this.initialRouteDrag;

    // Unlisten feature change listeners
    viaPointFeatures.forEach((feature) => {
      feature.un('change', this.relocateViaPoint);
    });

    // If viaPoint is being relocated overwrite the old viaPoint
    if (relocateViaPoint) {
      return this.addViaPoint(
        e.mapBrowserEvent.coordinate,
        relocateViaPoint.get('viaPointIdx'),
        1,
      );
    }

    // In case there is no route overwrite first coordinate
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
      const turfLineSegment = turfLineSlice(
        turfPoint(viaPointClosestPoints[i]),
        turfPoint(viaPointClosestPoints[i + 1]),
        turfLineString(oldRoute.getGeometry().getCoordinates()),
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
  }

  createDefaultElement() {
    /**
     * Define a default element.
     */
    this.element = document.createElement('button');
    this.element.id = 'ol-toggle-routing';
    this.element.innerHTML = 'Toggle Route Control';
    this.element.onclick = () =>
      this.active ? this.deactivate() : this.activate();
    Object.assign(this.element.style, {
      position: 'absolute',
      right: '10px',
      top: '10px',
    });
  }

  /**
   * Create the interaction used to modify vertexes of features.
   * @private
   */
  createModifyInteraction() {
    /**
     * @type {ol.interaction.Modify}
     * @private
     */
    // Define and add modify interaction
    this.modifyInteraction = new Modify({
      source: this.routingLayer.olLayer.getSource(),
      pixelTolerance: 4,
      hitDetection: this.routingLayer.olLayer,
      deleteCondition: (e) => {
        const feats = e.target.getFeaturesAtPixel(e.pixel, {
          hitTolerance: 5,
        });
        const viaPoint = feats.find(
          (feat) => feat.getGeometry() instanceof Point && feat.get('index'),
        );
        if (click(e) && viaPoint) {
          // Remove node & viaPoint if an existing viaPoint was clicked
          this.removeViaPoint(viaPoint.get('index'));
          return true;
        }
        return false;
      },
    });
    this.modifyInteraction.on('modifystart', this.onModifyStart);
    this.modifyInteraction.on('modifyend', this.onModifyEnd);
    this.modifyInteraction.setActive(false);
  }

  /**
   * Add click listener to map.
   * @private
   */
  addListeners() {
    this.removeListeners();
    this.onMapClickKey = this.map.on('singleclick', this.onMapClick);
  }

  /**
   * Remove click listener from map.
   * @private
   */
  removeListeners() {
    unByKey(this.onMapClickKey);
  }

  activate() {
    super.activate();
    if (this.map) {
      // Clean the modifyInteraction if present
      this.map.removeInteraction(this.modifyInteraction);

      // Add modify interaction, RoutingLayer and listeners
      this.map.addLayer(this.routingLayer);
      this.map.addInteraction(this.modifyInteraction);
      this.modifyInteraction.setActive(true);
      this.addListeners();
    }
  }

  deactivate() {
    if (this.map) {
      // Remove modify interaction, RoutingLayer, listeners and viaPoints
      this.map.removeLayer(this.routingLayer.olLayer);
      this.map.removeInteraction(this.modifyInteraction);
      this.removeListeners();
      this.reset();
    }
    super.deactivate();
  }
}

export default RoutingControl;
