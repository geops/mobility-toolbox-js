import { Feature } from 'ol';
import type { Map, MapBrowserEvent } from 'ol';
import { Geometry, LineString, Point } from 'ol/geom';
import { Modify } from 'ol/interaction';
import { unByKey } from 'ol/Observable';
import { click } from 'ol/events/condition';
import { GeoJSON } from 'ol/format';
import { buffer } from 'ol/extent';
import { fromLonLat, toLonLat } from 'ol/proj';
import type { Coordinate } from 'ol/coordinate';
import type { StyleLike } from 'ol/style/Style';
import BaseEvent from 'ol/events/Event';
import { EventsKey } from 'ol/events';
import { ModifyEvent } from 'ol/interaction/Modify';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Control, { Options } from 'ol/control/Control';
import { ObjectEvent } from 'ol/Object';
import { RoutingAPI } from '../../api';
import type {
  RoutingGraph,
  RoutingMot,
  RoutingParameters,
  RoutingViaPoint,
} from '../../types';

export type RoutingControlOptions = Options & {
  apiKey?: string;

  active?: boolean;

  stopsApiKey?: string;

  stopsApiUrl?: string;

  routingLayer?: VectorLayer<VectorSource<Feature<Geometry>>>;

  graphs?: RoutingGraph[];

  mot?: string;

  modify?: boolean;

  routingApiParams?: RoutingParameters;

  useRawViaPoints?: boolean;

  snapToClosestStation?: boolean;

  style?: StyleLike;

  onRouteError?: () => void;
};

export type AbotControllersByGraph = {
  [key: string]: AbortController;
};

// Examples for a single hop:
// basel sbb a station named "basel sbb"
// ZUE, station "Zürich HB" by its common abbreviation
// Zürich Hauptbahnhof or HBF Zürich are all valid synonyms für "Zürich HB"
// @47.37811,8.53935 a station at position 47.37811, 8.53935
// @47.37811,8.53935$4 track 4 in a station at position 47.37811, 8.53935
// zürich hb@47.37811,8.53935$8 track 8 in station "Zürich HB" at position 47.37811, 8.53935
/** @private */
const REGEX_VIA_POINT =
  /^([^@$!\n]*)(@?([\d.]+),([\d.]+))?(\$?([a-zA-Z0-9]{0,2}))$/;

// Examples for a single hop:
//
// 47.37811,8.53935 a position 47.37811, 8.53935
/** @private */
const REGEX_VIA_POINT_COORD = /^([\d.]+),([\d.]+)$/;

// Examples for a single hop:
//
// !8596126 a station with id 8596126
// !8596126$4 a station with id 8596126
/** @private */
const REGEX_VIA_POINT_STATION_ID = /^!([^$]*)(\$?([a-zA-Z0-9]{0,2}))$/;

/** @private */
const STOP_FETCH_ABORT_CONTROLLER_KEY = 'stop-fetch';

/** @private */
const getFlatCoordinatesFromSegments = (
  segmentArray: Feature[],
): Coordinate[] => {
  const coords: Coordinate[] = [];
  segmentArray.forEach((seg) => {
    // @ts-ignore
    const coordArr = seg.getGeometry()?.getCoordinates();
    if (coordArr?.length) {
      coords.push(...coordArr);
    }
  });
  return coords;
};

/**
 * This control allows the user to add and modifiy via points to a map and request a route from the [geOps Routing API](https://developer.geops.io/apis/routing/).
 *
 * @example
 * import { Map } from 'ol';
 * import { RoutingControl } from 'mobility-toolbox-js/ol';
 *
 * const map = new Map({
 *   target: 'map'
 * });
 *
 * const control = new RoutingControl();
 *
 * control.attachToMap(map)
 *
 * @classproperty {string} apiKey - Key used for RoutingApi requests.
 * @classproperty {string} stopsApiKey - Key used for Stop lookup requests (defaults to apiKey).
 * @classproperty {string} stopsApiUrl - Url used for Stop lookup requests (defaults to https://api.geops.io/stops/v1/lookup/).
 * @classproperty {Array.<Array<graph="osm", minZoom=0, maxZoom=99>>} graphs - Array of routing graphs and min/max zoom levels. If you use the control in combination with the [geOps Maps API](https://developer.geops.io/apis/maps/), you may want to use the optimal level of generalizations: "[['gen4', 0, 8], ['gen3', 8, 9], ['gen2', 9, 11], ['gen1', 11, 13], ['osm', 13, 99]]"
 * @classproperty {string} mot - Mean of transport to be used for routing.
 * @classproperty {object} routingApiParams - object of additional parameters to pass to the routing api request.
 * @classproperty {object} snapToClosestStation - If true, the routing will snap the coordinate to the closest station. Default to false.
 * @classproperty {boolean} useRawViaPoints - Experimental property. Wen true, it allows the user to add via points using different kind of string. See "via" parameter defined by the [geOps Routing API](https://developer.geops.io/apis/routing/). Default to false, only array of coordinates and station's id are supported as via points.
 * @classproperty {VectorLayer} routingLayer - Layer for adding route features.
 * @classproperty {function} onRouteError - Callback on error.
 * @classproperty {boolean} loading - True if the control is requesting the backend.
 * @see <a href="/example/ol-routing">Openlayers routing example</a>
 *
 * @extends {Control}
 * @implements {RoutingInterface}
 * @public
 */
class RoutingControl extends Control {
  map?: Map;

  viaPoints: RoutingViaPoint[] = [];

  routingLayer?: VectorLayer<VectorSource<Feature<Geometry>>>;

  graphs: RoutingGraph[] = [];

  routingApiParams?: RoutingParameters;

  useRawViaPoints: boolean = false;

  snapToClosestStation: boolean = false;

  cacheStationData: {
    [key: string]: Coordinate;
  } = {};

  abortControllers: {
    [key: string]: AbortController;
  } = {};

  apiKey?: string;

  stopsApiKey?: string;

  segments: Feature<LineString>[] = [];

  stopsApiUrl?: string;

  api?: RoutingAPI;

  format: GeoJSON = new GeoJSON({ featureProjection: 'EPSG:3857' });

  graphsResolutions?: [number, number][];

  onRouteError: (error?: Error, control?: RoutingControl) => void;

  onMapClickKey?: EventsKey;

  modifyInteraction?: Modify;

  initialRouteDrag?: {
    viaPoint?: Feature<Point>;
    oldRoute?: Feature<LineString>;
    segmentIndex?: number;
  } = {};

  get active(): boolean {
    return this.get('active');
  }

  set active(newValue: boolean) {
    this.set('active', newValue);
  }

  get loading(): boolean {
    return this.get('loading');
  }

  set loading(newValue: boolean) {
    this.set('loading', newValue);
  }

  get modify() {
    return this.get('modify');
  }

  set modify(newValue) {
    this.set('modify', newValue);
  }

  get mot(): RoutingMot {
    return this.get('mot');
  }

  set mot(newValue: RoutingMot) {
    this.set('mot', newValue);
  }

  constructor(options: RoutingControlOptions = {}) {
    super(options);

    if (!this.element) {
      this.createDefaultElement();
    }

    /** True if the control is requesting the backend. */
    this.loading = false;

    /** @private */
    this.active = options.active || true;

    /** @private */
    this.graphs = options.graphs || [['osm', 0, 99]];

    /** @private */
    this.mot = options.mot || 'bus';

    /** @private */
    this.modify = options.modify !== false;

    /** @private */
    this.routingApiParams = options.routingApiParams;

    /** @private */
    this.useRawViaPoints = options.useRawViaPoints || false;

    /** @private */
    this.snapToClosestStation = options.snapToClosestStation || false;

    /** @private */
    this.apiKey = options.apiKey;

    /** @private */
    this.stopsApiKey = options.stopsApiKey || this.apiKey;

    /** @private */
    this.stopsApiUrl = options.stopsApiUrl || 'https://api.geops.io/stops/v1/';

    /** @private */
    this.api = new RoutingAPI({
      ...options,
    });

    /** @private */
    this.routingLayer =
      options.routingLayer ||
      new VectorLayer({
        source: new VectorSource(),
        style: options.style,
      });

    /** @private */
    this.onRouteError =
      options.onRouteError ||
      ((error) => {
        this.dispatchEvent(new BaseEvent('change:route'));
        this.reset();
        // eslint-disable-next-line no-console
        console.error(error);
      });

    /** @private */
    this.onMapClick = this.onMapClick.bind(this);

    /** @private */
    this.onModifyEnd = this.onModifyEnd.bind(this);

    /** @private */
    this.onModifyStart = this.onModifyStart.bind(this);

    /** @private */
    this.createModifyInteraction();

    this.on('propertychange', (evt: ObjectEvent) => {
      if (evt.key === 'active') {
        this.onActiveChange();
      }
      if (evt.key === 'mot') {
        if (this.viaPoints) {
          this.drawRoute();
        }
      }
    });
  }

  /**
   * Calculate at which resolutions corresponds each generalizations.
   *
   * @private
   */
  static getGraphsResolutions(
    graphs: RoutingGraph[],
    map: Map,
  ): [number, number][] {
    const view = map.getView();
    return graphs.map(([, minZoom, maxZoom]) => [
      view.getResolutionForZoom(minZoom),
      view.getResolutionForZoom(maxZoom || minZoom + 1),
    ]);
  }

  /**
   * Activet7deactivate the control when activ eproperty changes
   * @private
   */
  onActiveChange() {
    if (this.get('active')) {
      this.activate();
    } else {
      this.deactivate();
    }
    this.render();
  }

  /**
   * Adds/Replaces a viaPoint to the viaPoints array and redraws route:
   *   Adds a viaPoint at end of array by default.
   *   If an index is passed a viaPoint is added at the specified index.
   *   If an index is passed and overwrite x is > 0, x viaPoints at the specified
   *     index are replaced with a single new viaPoint.
   * @param {number[]|string} coordinates Array of coordinates
   * @param {number} [index=-1] Integer representing the index of the added viaPoint. If not specified, the viaPoint is added at the end of the array.
   * @param {number} [overwrite=0] Marks the number of viaPoints that are removed at the specified index on add.
   * @public
   */
  addViaPoint(
    coordinatesOrString: RoutingViaPoint,
    index: number = -1,
    overwrite: number = 0,
  ) {
    /* Add/Insert/Overwrite viapoint and redraw route */
    this.viaPoints.splice(
      index === -1 ? this.viaPoints.length : index,
      overwrite,
      coordinatesOrString,
    );
    this.drawRoute();
    this.dispatchEvent(new BaseEvent('change:route'));
  }

  /**
   * Removes a viaPoint at the passed array index and redraws route
   * By default the last viaPoint is removed.
   * @param {number} index Integer representing the index of the viaPoint to delete.
   * @public
   */
  removeViaPoint(index = (this.viaPoints || []).length - 1) {
    /* Remove viapoint and redraw route */
    if (this.viaPoints.length && this.viaPoints[index]) {
      this.viaPoints.splice(index, 1);
    }
    this.drawRoute();
    this.dispatchEvent(new BaseEvent('change:route'));
  }

  /**
   * Replaces the current viaPoints with a new coordinate array.
   * @param {Array<Array<number>>} coordinateArray Array of nested coordinates
   * @public
   */
  setViaPoints(coordinateArray: Coordinate[]) {
    this.viaPoints = [...coordinateArray];
    this.drawRoute();
    this.dispatchEvent(new BaseEvent('change:route'));
  }

  /**
   * Removes all viaPoints, clears the source and triggers a change event
   * @public
   */
  reset() {
    // Clear viaPoints and source
    this.abortRequests();
    this.viaPoints = [];
    this.routingLayer?.getSource()?.clear();
    this.dispatchEvent(new BaseEvent('change:route'));
  }

  /**
   * Aborts viapoint and route requests
   * @private
   */
  abortRequests() {
    // Abort Routing API requests
    this.graphs.forEach((graph) => {
      const graphName = graph[0];
      if (this.abortControllers[graphName]) {
        this.abortControllers[graphName].abort();
      }
      this.abortControllers[graphName] = new AbortController();
    });

    // Abort Stops API requests
    this.abortControllers[STOP_FETCH_ABORT_CONTROLLER_KEY]?.abort();
    this.abortControllers[STOP_FETCH_ABORT_CONTROLLER_KEY] =
      new AbortController();

    this.loading = false;
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
    this.abortRequests();
    this.routingLayer?.getSource()?.clear(true);

    if (!this.viaPoints.length) {
      return null;
    }

    if (this.viaPoints.length === 1) {
      // Add point for first node
      return this.drawViaPoint(
        this.viaPoints[0],
        0,
        this.abortControllers[STOP_FETCH_ABORT_CONTROLLER_KEY],
      );
    }

    const formattedViaPoints = this.viaPoints.map((viaPoint) => {
      if (Array.isArray(viaPoint)) {
        const projection = this.getMap()?.getView().getProjection();
        // viaPoint is a coordinate
        // Coordinates need to be reversed as required by the backend RoutingAPI
        const [lon, lat] = toLonLat(viaPoint, projection);
        return this.snapToClosestStation ? [`@${lat}`, lon] : [lat, lon];
      }

      // viaPoint is a string to use as it is
      return this.useRawViaPoints ? viaPoint : `!${viaPoint}`;
    });

    this.loading = true;

    // Create point features for the viaPoints
    this.viaPoints.forEach((viaPoint, idx) =>
      this.drawViaPoint(
        viaPoint,
        idx,
        this.abortControllers[STOP_FETCH_ABORT_CONTROLLER_KEY],
      ),
    );

    return Promise.all(
      this.graphs.map(([graph], index) => {
        const { signal } = this.abortControllers[graph];
        if (!this.api) {
          return Promise.resolve([]);
        }
        return this.api
          .route(
            {
              graph,
              via: `${formattedViaPoints.join('|')}`,
              mot: this.mot,
              // @ts-ignore missing property in swagger
              'resolve-hops': false,
              elevation: false,
              'coord-radius': 100.0,
              'coord-punish': 1000.0,
              ...(this.routingApiParams || {}),
            },
            { signal },
          )
          .then((featureCollection) => {
            this.segments = this.format.readFeatures(
              featureCollection,
            ) as Feature<LineString>[];

            if (this.mot === 'foot') {
              // Extract unique values from viaPoint target value
              const uniqueVias = this.segments.reduce(
                (resultVias: Coordinate[], currentFeat: Feature) => {
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

            if (
              this.graphsResolutions &&
              this.graphsResolutions[index]?.length >= 2
            ) {
              routeFeature.set(
                'minResolution',
                this.graphsResolutions[index][0],
              );
              routeFeature.set(
                'maxResolution',
                this.graphsResolutions[index][1],
              );
            }

            this.routingLayer?.getSource()?.addFeature(routeFeature);
            this.loading = false;
          })
          .catch((error) => {
            if (/AbortError/.test(error.message)) {
              // Ignore abort error
              return;
            }
            this.segments = [];
            // Dispatch error event and execute error function
            this.dispatchEvent(new BaseEvent('error'));
            this.onRouteError(error, this);
            this.routingLayer?.getSource()?.clear();
            this.loading = false;
          });
      }),
    );
  }

  /**
   * Draw a via point. This function can parse all the possibilitiies
   *
   * @private
   */
  drawViaPoint(
    viaPoint: RoutingViaPoint,
    idx: number,
    abortController: AbortController,
  ) {
    const pointFeature = new Feature();
    pointFeature.set('viaPointIdx', idx);

    // The via point is a coordinate using the current map's projection
    if (Array.isArray(viaPoint)) {
      pointFeature.setGeometry(new Point(viaPoint));
      this.routingLayer?.getSource()?.addFeature(pointFeature);
      return Promise.resolve(pointFeature);
    }

    // Possibility to parse:
    //
    // !8596126 a station with id 8596126
    // !8596126$4 a station with id 8596126
    if (!this.useRawViaPoints || REGEX_VIA_POINT_STATION_ID.test(viaPoint)) {
      let stationId: string;
      let track: string;
      if (this.useRawViaPoints) {
        [, stationId, , track] =
          REGEX_VIA_POINT_STATION_ID.exec(viaPoint) || [];
      } else {
        [stationId, track] = viaPoint.split('$');
      }

      return fetch(
        `${this.stopsApiUrl}lookup/${stationId}?key=${this.stopsApiKey}`,
        { signal: abortController.signal },
      )
        .then((res) => res.json())
        .then((stationData) => {
          const { coordinates } = stationData.features[0].geometry;
          this.cacheStationData[viaPoint] = fromLonLat(coordinates);
          pointFeature.set('viaPointTrack', track);
          pointFeature.setGeometry(new Point(fromLonLat(coordinates)));
          this.routingLayer?.getSource()?.addFeature(pointFeature);
          return pointFeature;
        })
        .catch((error) => {
          if (/AbortError/.test(error.message)) {
            // Ignore abort error
            return;
          }
          // Dispatch error event and execute error function
          this.dispatchEvent(new BaseEvent('error'));
          this.onRouteError(error, this);
          this.loading = false;
        });
    }

    // Only when this.useRawViaPoints is true.
    // Possibility to parse:
    //
    // 47.37811,8.53935 a position 47.37811, 8.53935
    if (this.useRawViaPoints && REGEX_VIA_POINT_COORD.test(viaPoint)) {
      const [lat, lon] = REGEX_VIA_POINT_COORD.exec(viaPoint) || [];
      if (lon && lat) {
        const floatLon = parseFloat(lon);
        const floatLat = parseFloat(lat);
        const coordinates = fromLonLat(
          [floatLon, floatLat],
          this.getMap()?.getView().getProjection(),
        );
        pointFeature.setGeometry(new Point(coordinates));
        this.routingLayer?.getSource()?.addFeature(pointFeature);
        return Promise.resolve(pointFeature);
      }
    }

    // Only when this.useRawViaPoints is true.
    // It will parse the via point to find some name, id, track coordinates.
    //
    // Possibility to parse:
    //
    // @47.37811,8.53935 a station at position 47.37811, 8.53935
    // @47.37811,8.53935$4 track 4 in a station at position 47.37811, 8.53935
    // zürich hb@47.37811,8.53935$8 track 8 in station "Zürich HB" at position 47.37811, 8.53935
    const [, stationName, , lat, lon, , track] =
      REGEX_VIA_POINT.exec(viaPoint) || [];

    if (lon && lat) {
      const coordinates = fromLonLat(
        [parseFloat(lon), parseFloat(lat)],
        this.getMap()?.getView().getProjection(),
      );
      pointFeature.set('viaPointTrack', track);
      pointFeature.setGeometry(new Point(coordinates));
      this.routingLayer?.getSource()?.addFeature(pointFeature);
      return Promise.resolve(pointFeature);
    }

    if (stationName) {
      return fetch(
        `${this.stopsApiUrl}?key=${this.stopsApiKey}&q=${stationName}&limit=1`,
        { signal: abortController.signal },
      )
        .then((res) => res.json())
        .then((stationData) => {
          const { coordinates } = stationData.features[0].geometry;
          this.cacheStationData[viaPoint] = fromLonLat(coordinates);
          pointFeature.set('viaPointTrack', track);
          pointFeature.setGeometry(new Point(fromLonLat(coordinates)));
          this.routingLayer?.getSource()?.addFeature(pointFeature);
          return pointFeature;
        })
        .catch((error) => {
          // Dispatch error event and execute error function
          this.dispatchEvent(new BaseEvent('error'));
          this.onRouteError(error, this);
          this.loading = false;
          return null;
        });
    }
    return Promise.resolve(null);
  }

  /**
   * Used on click on map while control is active:
   *   By default adds a viaPoint to the end of array.
   *   If an existing viaPoint is clicked removes the clicked viaPoint.
   * @private
   */
  onMapClick(evt: MapBrowserEvent<MouseEvent>) {
    const feats = (evt.target as Map).getFeaturesAtPixel(evt.pixel, {
      layerFilter: (layer) => layer === this.routingLayer,
      hitTolerance: 5,
    }) as Feature<Geometry>[];
    const viaPoint = feats.find(
      (feat: Feature<Geometry>) =>
        feat.getGeometry()?.getType() === 'Point' &&
        feat.get('viaPointIdx') !== undefined,
    );

    if (viaPoint) {
      // Remove existing viaPoint on click and abort viaPoint add
      this.removeViaPoint(viaPoint.get('viaPointIdx'));
      return;
    }

    this.addViaPoint(evt.coordinate);
  }

  /**
   * Used on start of the modify interaction. Stores relevant data
   * in this.initialRouteDrag object
   * @private
   */
  onModifyStart(evt: ModifyEvent) {
    // When modify start, we search the index of the segment that is modifying.
    let segmentIndex = -1;
    const route: Feature<LineString> = evt.features
      .getArray()
      .find(
        (feat) => feat.getGeometry()?.getType() === 'LineString',
      ) as unknown as Feature<LineString>;

    // Find the segment index that is being modified
    if (route && route.getGeometry() && evt.mapBrowserEvent.coordinate) {
      // We use a buff extent to fix floating issues , see https://github.com/openlayers/openlayers/issues/7130#issuecomment-535856422
      const closestExtent = buffer(
        new Point(
          // @ts-ignore
          route.getGeometry()?.getClosestPoint(evt.mapBrowserEvent.coordinate),
        ).getExtent(),
        0.001,
      );

      segmentIndex = this.segments.findIndex((segment) =>
        segment.getGeometry()?.intersectsExtent(closestExtent),
      );
    }

    // Find the viaPoint that is being modified
    const viaPoint: Feature<Point> = (evt.features
      .getArray()
      .filter((feat) => feat.getGeometry()?.getType() === 'Point') ||
      [])[0] as Feature<Point>;

    // Write object with modify info
    /** @private */
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
  onModifyEnd(evt: ModifyEvent) {
    const coord = evt.mapBrowserEvent.coordinate;
    const { oldRoute, viaPoint, segmentIndex } = this.initialRouteDrag || {};

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
    return this.addViaPoint(coord, (segmentIndex || 0) + 1);
  }

  /**
   * Define a default element.
   *
   * @private
   */
  createDefaultElement() {
    /** @private */
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
      source: this.routingLayer?.getSource() || undefined,
      pixelTolerance: 6,
      // hitDetection: this.routingLayer, // Create a bug, the first point is always selected even if the mous eis far away
      deleteCondition: (e) => {
        const feats = e.target?.getFeaturesAtPixel(
          e.pixel,
          {
            hitTolerance: 5,
          } || [],
        ) as Feature<Geometry>[];
        const viaPoint = feats.find(
          (feat) =>
            feat.getGeometry()?.getType() === 'Point' && feat.get('index'),
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
    /** @private */
    this.onMapClickKey = this.getMap()?.on('singleclick', this.onMapClick);
  }

  /**
   * Remove click listener from map.
   * @private
   */
  removeListeners() {
    if (this.onMapClickKey) {
      unByKey(this.onMapClickKey);
    }
  }

  setMap(map: Map) {
    super.setMap(map);
    if (map && this.active) {
      this.activate();
    } else if (!map) {
      this.active = false;
    }
  }

  activate() {
    const map = this.getMap();
    if (map) {
      /** @private */
      this.format = new GeoJSON({
        featureProjection: map.getView().getProjection(),
      });

      /** @private */
      this.graphsResolutions = RoutingControl.getGraphsResolutions(
        this.graphs,
        map,
      );

      // Clean the modifyInteraction if present
      if (this.modifyInteraction) {
        map.removeInteraction(this.modifyInteraction);
      }

      // Add modify interaction, RoutingLayer and listeners
      // @ts-ignore
      // this.routingLayer?.attachToMap(this.getMap());
      if (this.modifyInteraction) {
        map.addInteraction(this.modifyInteraction);
      }
      this.modifyInteraction?.setActive(this.modify);
      this.addListeners();
    }
  }

  deactivate() {
    const map = this.getMap();

    if (map) {
      // Remove modify interaction, RoutingLayer, listeners and viaPoints
      // @ts-ignore
      // this.routingLayer?.detachFromMap();
      if (this.modifyInteraction) {
        map.removeInteraction(this.modifyInteraction);
      }
      this.removeListeners();
      this.reset();
    }
  }

  render() {}
}

export default RoutingControl;
