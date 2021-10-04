import { WebGLPoints, Group } from 'ol/layer';
import { unByKey } from 'ol/Observable';
import { Vector } from 'ol/source';
import { Point } from 'ol/geom';
import GeomType from 'ol/geom/GeometryType';
import { asArray } from 'ol/color';
import mixin from '../../common/mixins/TrackerLayerMixin';
import Layer from './Layer';

/**
 * Responsible for loading tracker data.
 *
 * @extends {Layer}
 * @implements {TrackerLayerInterface}
 */
class TrackerLayer extends mixin(Layer) {
  /**
   * Constructor.
   *
   * @param {Object} options
   * @param {boolean} options.useDelayStyle Set the delay style.
   * @private
   */
  constructor(options = {}) {
    // We use a group to be able to add custom vector layer in extended class.
    // For example TrajservLayer use a vectorLayer to display the complete trajectory.
    super({
      ...options,
      useRequestAnimationFrame: true,
    });

    /**
     * Function to define  when allowing the render of trajectories depending on the zoom level. Default the fundtion return true.
     * It's useful to avoid rendering the map when the map is animating or interacting.
     * @type {function}
     */
    this.renderWhenZooming = options.renderWhenZooming || (() => true);

    /**
     * Function to define  when allowing the render of trajectories depending on the rotation. Default the fundtion return true.
     * It's useful to avoid rendering the map when the map is animating or interacting.
     * @type {function}
     */
    this.renderWhenRotating = options.renderWhenRotating || (() => true);
    const sizeTrain = [
      'interpolate',
      ['linear'],
      ['zoom'],
      5,
      2 * 2,
      12,
      15 * 2,
    ];
    this.olLayer =
      options.olLayer ||
      new Group({
        layers: [
          new WebGLPoints({
            source: new Vector({ features: [] }),
            style: {
              symbol: {
                symbolType: 'circle',
                size: [
                  'match',
                  ['get', 'ProductIdentifier'],
                  'Tram',
                  7 * 2,
                  'Subway / Metro / S-Bahn',
                  7 * 2,
                  'Train',
                  sizeTrain,
                  'Bus',
                  7 * 2,
                  'Ferry',
                  7 * 2,
                  'Cable Car',
                  7 * 2,
                  'Gondola',
                  7 * 2,
                  'Funicular',
                  7 * 2,
                  'Long distance bus',
                  7 * 2,
                  'Rail',
                  sizeTrain,
                  2,
                ],
                color: [
                  'case',
                  ['>', ['get', 'red'], 0],
                  ['color', ['get', 'red'], ['get', 'green'], ['get', 'blue']],
                  [
                    'match',
                    ['get', 'ProductIdentifier'],
                    'Tram',
                    '#ffb400',
                    'Subway / Metro / S-Bahn',
                    '#ff5400',
                    'Train',
                    '#ff8080',
                    'Bus',
                    '#ea0000',
                    'Ferry',
                    '#3000ff',
                    'Cable Car',
                    '#ffb400',
                    'Gondola',
                    '#41a27b',
                    'Funicular',
                    '#00d237',
                    'Long distance bus',
                    '#b5b5b5',
                    'Rail',
                    '#ff8080',
                    '#000000',
                  ],
                ],
                offset: [0, 0],
                opacity: 0.95,
              },
            },
            disableHitDetection: false,
          }),
        ],
      });

    // Options the last render run did happen. If something changes
    // we have to render again
    /** @ignore */
    this.renderState = {
      center: [0, 0],
      zoom: null,
      rotation: 0,
    };

    /**
     * Array of ol events key, returned by on() or once().
     * @type {Array<ol/events~EventsKey>}
     * @private
     */
    this.olEventsKeys = []; // Be careful to not override this value in child classe.
  }

  /**
   * Initialize the layer and listen to feature clicks.
   * @param {ol/Map~Map} map A OpenLayers map.
   * @private
   */
  init(map) {
    if (!map) {
      return;
    }

    super.init(map, {
      getPixelFromCoordinate: map.getPixelFromCoordinate.bind(map),
    });
  }

  /**
   * Trackerlayer is started.
   * @private
   */
  start() {
    super.start();

    this.olEventsKeys = [
      this.map.on('moveend', () => {
        const z = this.map.getView().getZoom();

        if (z !== this.currentZoom) {
          /**
           * Current value of the zoom.
           * @type {number}
           */
          this.currentZoom = z;
          this.startUpdateTime(z);
        }
      }),
      this.map.on('pointermove', (evt) => {
        if (
          this.map.getView().getInteracting() ||
          this.map.getView().getAnimating() ||
          !this.isHoverActive
        ) {
          return;
        }
        const [vehicle] = this.getVehiclesAtCoordinate(evt.coordinate, 1);
        const id = vehicle && vehicle.id;
        if (this.hoverVehicleId !== id) {
          this.map.getTargetElement().style.cursor = vehicle
            ? 'pointer'
            : 'auto';
          this.hoverVehicleId = id;
          this.renderTrajectories();
        }
      }),
    ];
  }

  /**
   * Stop current layer.
   * @private
   */
  stop() {
    super.stop();
    unByKey(this.olEventsKeys);
    this.olEventsKeys = [];
  }

  getInterpolatedPosition(traj) {
    this.interpolate = true;
    const {
      coordinate,
      TimeIntervals: timeIntervals,
      TimeOffset: timeOffset,
      geometry,
    } = traj.getProperties();
    let coord = null;
    if (coordinate) {
      coord = coordinate;
      return coord;
    }
    if (timeIntervals && timeIntervals.length > 1) {
      const now = this.time - (timeOffset || 0);
      let start;
      let end;
      let startFrac;
      let endFrac;
      let timeFrac;
      let rotation;

      // Search th time interval.
      for (let j = 0; j < timeIntervals.length - 1; j += 1) {
        // Rotation only available in tralis layer.
        [start, startFrac, rotation] = timeIntervals[j];
        [end, endFrac] = timeIntervals[j + 1];

        if (start <= now && now <= end) {
          break;
        } else {
          start = null;
          end = null;
        }
      }
      // The geometry can also be a Point
      if (geometry.getType() === GeomType.POINT) {
        coord = geometry.getCoordinates();
      } else if (geometry.getType() === GeomType.LINE_STRING) {
        if (start && end) {
          // interpolate position inside the time interval.
          timeFrac = this.interpolate
            ? Math.min((now - start) / (end - start), 1)
            : 0;

          const geomFrac = this.interpolate
            ? timeFrac * (endFrac - startFrac) + startFrac
            : 0;

          coord = geometry.getCoordinateAt(geomFrac);

          // It happens that the now date was some ms before the first timeIntervals we have.
        } else if (now < timeIntervals[0][0]) {
          [[, , rotation]] = timeIntervals;
          timeFrac = 0;
          coord = geometry.getFirstCoordinate();
        } else if (now > timeIntervals[timeIntervals.length - 1][0]) {
          [, , rotation] = timeIntervals[timeIntervals.length - 1];
          timeFrac = 1;
          coord = geometry.getLastCoordinate();
        }
      } else {
        // eslint-disable-next-line no-console
        console.error(
          'This geometry type is not supported. Only Point or LineString are. Current geometry: ',
          geometry,
        );
      }
      // // We set the rotation and the timeFraction of the trajectory (used by tralis).
      // // if rotation === null that seems there is no rotation available.
      // eslint-disable-next-line no-param-reassign
      traj.rotation = rotation;
      // eslint-disable-next-line no-param-reassign
      traj.endFraction = timeFrac || 0;
    }
    return coord;
  }

  /**
   * Render the trajectories using current map's size, resolution and rotation.
   * @param {boolean} noInterpolate if true, renders the vehicles without interpolating theirs positions.
   * @overrides
   */
  renderTrajectories() {
    const source = this.olLayer.getLayers().getArray()[1].getSource();
    // console.log(this.olLayer.getLayers().getArray()[1]);

    if (
      this.map.getView().getAnimating() ||
      this.map.getView().getInteracting()
    ) {
      return;
    }
    source.clear(true);

    const points = [];
    for (let i = 0; i < (this.trajectories || []).length; i += 1) {
      const traj = this.trajectories[i];
      const coord = this.getInterpolatedPosition(traj);
      if (coord) {
        const point = traj.clone();
        point.setGeometry(new Point(coord));
        // For the style
        if (point.get('Color')) {
          const color = asArray(`#${point.get('Color')}`);
          point.set('red', color[0]);
          point.set('green', color[1]);
          point.set('blue', color[2]);
        }
        points.push(point);
      }
    }
    // console.log('lalal', points);
    if (points.length) {
      source.addFeatures(points);
    }
    // super.renderTrajectories(
    //   this.map.getSize(),
    //   view.getResolution(),
    //   view.getRotation(),
    //   noInterpolate,
    // );
  }

  /**
   * Return the delay in ms before the next rendering.
   */
  getRefreshTimeInMs() {
    return super.getRefreshTimeInMs(this.map.getView().getZoom());
  }

  /**
   * Returns the vehicle which are at the given coordinates.
   * Returns null when no vehicle is located at the given coordinates.
   * @param {ol/coordinate~Coordinate} coordinate
   * @param {number} nb Number of vehicles to return;
   * @returns {Array<ol/Feature~Feature>} Vehicle feature.
   * @override
   */
  getVehiclesAtCoordinate(coordinate, nb) {
    const resolution = this.map.getView().getResolution();
    return super.getVehiclesAtCoordinate(coordinate, resolution, nb);
  }

  /**
   * Create a copy of the TrackerLayer.
   * @param {Object} newOptions Options to override
   * @returns {TrackerLayer} A TrackerLayer
   */
  clone(newOptions) {
    return new TrackerLayer({ ...this.options, ...newOptions });
  }
}

export default TrackerLayer;
