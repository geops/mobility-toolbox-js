import { Feature } from 'ol';
import { LineString, Point } from 'ol/geom';
import { Modify } from 'ol/interaction';
import { unByKey } from 'ol/Observable';
import { click } from 'ol/events/condition';
import { GeoJSON } from 'ol/format';
import { buffer } from 'ol/extent';
import { fromLonLat, toLonLat } from 'ol/proj';
import RoutingAPI from '../../api/routing/RoutingAPI';
import Control from '../../common/controls/Control';
import RoutingLayer from '../layers/RoutingLayer';

const getFlatCoordinatesFromSegments = (segmentArray) => {
  const coords = [];
  segmentArray.forEach((seg) => {
    coords.push(...seg.getGeometry().getCoordinates());
  });
  return coords;
};

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
 * @classproperty {Array.<Array<graph="osm", minZoom=0, maxZoom=99>>} graphs - Array of routing graphs and min/max zoom levels. If you use the control in combination with the [geOps Maps API](https://developer.geops.io/apis/maps/), you may want to use the optimal level of generalizations: "[['gen4', 0, 8], ['gen3', 8, 9], ['gen2', 9, 11], ['gen1', 11, 13], ['osm', 13, 99]]"
 * @classproperty {string} mot - Mean of transport to be used for routing.
 * @classproperty {object} routingApiParams - object of additional parameters to pass to the routing api request.
 * @classproperty {RoutingLayer|Layer} routingLayer - Layer for adding route features.
 * @classproperty {function} onRouteError - Callback on error.
 * @classproperty {boolean} loading - True if the control is requesting the backend.
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
        get: () => this.get('mot'),
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
        get: () => this.get('loading'),
        set: (newLoading) => {
          this.set('loading', newLoading);
        },
      },
      modify: {
        get: () => this.get('modify'),
        set: (modify) => {
          this.set('modify', modify);
        },
      },
    });

    /** True if the control is requesting the backend. */
    this.loading = false;

    /** @ignore */
    this.graphs = options.graphs || [['osm', 0, 99]];

    /** @ignore */
    this.mot = options.mot || 'bus';

    /** @ignore */
    this.modify = options.modify !== false;

    /** @ignore */
    this.routingApiParams = options.routingApiParams || {};

    /** @ignore */
    this.cacheStationData = {};

    /** @ignore */
    this.abortControllers = [];

    /** @ignore */
    this.apiKey = options.apiKey;

    /** @ignore */
    this.stopsApiKey = options.stopsApiKey || this.apiKey;

    /** @ignore */
    this.segments = [];

    /** @ignore */
    this.stopsApiUrl =
      options.stopsApiUrl || 'https://api.geops.io/stops/v1/lookup/';

    /** @ignore */
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
        style: options.style,
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

    /** @ignore */
    this.viaPoints = [];
    this.onMapClick = this.onMapClick.bind(this);
    this.onModifyEnd = this.onModifyEnd.bind(this);
    this.onModifyStart = this.onModifyStart.bind(this);

    /** @ignore */
    this.apiChangeListener = () => this.drawRoute();

    /** @ignore */
    this.createModifyInteraction();
  }

  /**
   * Calculate at which resolutions corresponds each generalizations.
   *
   * @private
   */
  static getGraphsResolutions(graphs, map) {
    const view = map.getView();
    return graphs.map(([, minZoom, maxZoom]) => [
      view.getResolutionForZoom(minZoom),
      view.getResolutionForZoom(maxZoom || minZoom + 1),
    ]);
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
    if (this.viaPoints.length < 2) {
      return null;
    }

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

    // Clear source
    this.routingLayer.olLayer.getSource().clear();

    // Create point features for the viaPoints
    this.viaPoints.forEach((viaPoint, idx) => this.drawViaPoint(viaPoint, idx));

    return Promise.all(
      this.graphs.map(([graph], index) => {
        if (this.abortControllers[graph]) {
          this.abortControllers[graph].abort();
        }
        this.abortControllers[graph] = new AbortController();
        return this.api
          .route(
            {
              graph,
              via: `${formattedViaPoints.join('|')}`,
              mot: `${this.mot}`,
              'resolve-hops': false,
              elevation: false,
              'coord-radius': 100.0,
              'coord-punish': 1000.0,
              ...this.routingApiParams,
            },
            this.abortControllers[graph],
          )
          .then((featureCollection) => {
            this.segments = this.format.readFeatures(featureCollection);

            if (this.mot === 'foot') {
              // Extract unique values from viaPoint target value
              const uniqueVias = this.segments.reduce(
                (resultVias, currentFeat) => {
                  const segTrg = currentFeat.get('trg');
                  return resultVias.find(
                    (via) => via[0] === segTrg[0] && via[1] === segTrg[1],
                  )
                    ? resultVias
                    : [...resultVias, segTrg];
                },
                [],
              );

              // Create LineString features from segments with same unique value
              this.segments = uniqueVias.map((via) => {
                const viaSegments = this.segments.filter((seg) => {
                  const segTrg = seg.get('trg');
                  return segTrg[0] === via[0] && segTrg[1] === via[1];
                });

                const coords = getFlatCoordinatesFromSegments(viaSegments);
                return new Feature({
                  geometry: new LineString(coords),
                });
              });
            }

            // Create the new route. This route will be modifiable by the Modifiy interaction.
            const coords = getFlatCoordinatesFromSegments(this.segments);

            const routeFeature = new Feature({
              geometry: new LineString(coords),
            });
            routeFeature.set('graph', graph);
            routeFeature.set('mot', this.mot);
            routeFeature.set('minResolution', this.graphsResolutions[index][0]);
            routeFeature.set('maxResolution', this.graphsResolutions[index][1]);
            this.routingLayer.olLayer.getSource().addFeature(routeFeature);
          })
          .catch((error) => {
            if (error.name === 'AbortError') {
              // Ignore abort error
              return;
            }
            this.segments = [];
            // Dispatch error event and execute error function
            this.dispatchEvent({
              type: 'error',
              target: this,
            });
            this.onRouteError(error, this);
          });
      }),
    );
  }

  /**
   * Draw a via point.
   *
   * @private
   */
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
        this.cacheStationData[viaPoint] = fromLonLat(coordinates);
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
  onModifyStart(evt) {
    // When modify start, we search the index of the segment that is modifying.
    let segmentIndex = -1;
    const route = evt.features
      .getArray()
      .find((feat) => feat.getGeometry() instanceof LineString);

    // Find the segment index that is being modified
    if (route) {
      // We use a buff extent to fix floating issues , see https://github.com/openlayers/openlayers/issues/7130#issuecomment-535856422
      const closestExtent = buffer(
        new Point(
          route.getGeometry().getClosestPoint(evt.mapBrowserEvent.coordinate),
        ).getExtent(),
        0.001,
      );

      segmentIndex = this.segments.findIndex((segment) =>
        segment.getGeometry().intersectsExtent(closestExtent),
      );
    }

    // Find the viaPoint that is being modified
    const viaPoint = (evt.features
      .getArray()
      .filter((feat) => feat.getGeometry() instanceof Point) || [])[0];

    // Write object with modify info
    /** @ignore */
    this.initialRouteDrag = {
      viaPoint,
      oldRoute: route && route.clone(),
      segmentIndex,
    };
  }

  /**
   * Used on end of the modify interaction. Resolves feature modification:
   *   Line drag creates new viaPoint at the final coordinate of drag.
   *   Point drag replaces old viaPoint.
   * @private
   */
  onModifyEnd(evt) {
    const coord = evt.mapBrowserEvent.coordinate;
    const { oldRoute, viaPoint, segmentIndex } = this.initialRouteDrag;

    // If viaPoint is being relocated overwrite the old viaPoint
    if (viaPoint) {
      return this.addViaPoint(coord, viaPoint.get('viaPointIdx'), 1);
    }

    // In case there is no route overwrite first coordinate
    if (!oldRoute) {
      return this.addViaPoint(coord, 0, 1);
    }

    // We can't add a via point because we haven't found which segment has been modified.
    if (segmentIndex === -1) {
      return Promise.reject(new Error('No segment found'));
    }

    // Insert new viaPoint at the  modified segment index + 1
    return this.addViaPoint(coord, segmentIndex + 1);
  }

  /**
   * Define a default element.
   *
   * @private
   */
  createDefaultElement() {
    /** @ignore */
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
    if (!this.modify) {
      return;
    }
    this.removeListeners();
    /** @ignore */
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
      /** @ignore */
      this.format = new GeoJSON({
        featureProjection: this.map.getView().getProjection(),
      });

      /** @ignore */
      this.graphsResolutions = RoutingControl.getGraphsResolutions(
        this.graphs,
        this.map,
      );

      // Clean the modifyInteraction if present
      this.map.removeInteraction(this.modifyInteraction);

      // Add modify interaction, RoutingLayer and listeners
      this.map.addLayer(this.routingLayer);
      this.map.addInteraction(this.modifyInteraction);
      this.modifyInteraction.setActive(this.modify);
      this.addListeners();
    } else {
      // fall back to some default values if map is not available
      this.format = new GeoJSON({ featureProjection: 'EPSG:3857' });
      this.graphsResolutions = this.graphs;
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
