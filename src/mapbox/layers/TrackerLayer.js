import { unByKey } from 'ol/Observable';
import { toLonLat, fromLonLat } from 'ol/proj';
import Layer from './Layer';
import Tracker from '../../common/Tracker';
import { timeSteps } from '../../common/trackerConfig';
import { getResolution } from '../utils';
import GetVehicleAtCoordinateW from '../../common/workers/getVehicleAtCoordinate.worker';

/**
 * Responsible for loading tracker data.
 * Extended from Layer {@link https://react-spatial.geops.de/docjs.html react-spatial/layers/Layer}
 * @class
 * @inheritDoc
 * @param {Object} options
 * @param {boolean} options.useDelayStyle Set the delay style.
 * @param {string} options.onClick Callback function on feature click.
 * @private
 */
class TrackerLayer extends Layer {
  constructor(options = {}) {
    super({
      ...options,
    });

    // Array of ol events key. Be careful to not override this value in child classe.
    this.olEventsKeys = [];

    /**
     * Cache object for trajectories drawn.
     * @private
     */
    this.styleCache = {};

    /**
     * Time speed.
     * @private
     */
    this.speed = 1;

    /**
     * Time used to display the trajectories.
     * @private
     */
    this.currTime = new Date();

    /**
     * Keep track of the last time used to render trajectories.
     * Useful when the speed increase.
     * @private
     */
    this.lastUpdateTime = new Date();

    /**
     * Activate/deactivate pointer hover effect.
     * @private
     */
    this.isHoverActive =
      options.isHoverActive !== undefined ? options.isHoverActive : true;

    /**
     * Callback function when a user click on a vehicle.
     * @private
     */
    this.clickCallbacks = [];

    // Add click callback
    if (options.onClick) {
      this.onClick(options.onClick);
    }

    /**
     * Custom property for duck typing since `instanceof` is not working
     * when the instance was created on different bundles.
     * @public
     */
    this.isTrackerLayer = true;
  }

  /**
   * Initialize the layer and listen to feature clicks.
   * @param {ol.map} map {@link https://openlayers.org/en/latest/apidoc/module-ol_Map-Map.html Map}
   * @private
   */
  init(map) {
    super.init(map);
    if (!this.map) {
      return;
    }
    this.getVehicleAtCoordinateWorker = new GetVehicleAtCoordinateW();

    const { width, height } = map.getCanvas();
    this.tracker = new Tracker({
      width,
      height,
      getPixelFromCoordinate: (coord) => {
        const pixelRatio = window.devicePixelRatio || 1;
        const [lng, lat] = toLonLat(coord);
        const { x, y } = this.map.project({ lng, lat });
        return [x * pixelRatio, y * pixelRatio];
      },
    });
    this.tracker.setStyle((props, r) => this.style(props, r));

    if (this.getVisible()) {
      this.start();
    }

    this.visibilityRef = this.on('change:visible', (evt) => {
      if (evt.target.getVisible()) {
        this.start();
      } else {
        this.stop();
      }
    });
  }

  terminate() {
    this.stop();
    unByKey(this.visibilityRef);
    if (this.tracker) {
      this.tracker.destroy();
      this.tracker = null;
    }
    super.terminate();
  }

  /**
   * Get the duration before the next update.
   * @private
   */
  getRefreshTimeInMs() {
    const z = this.map.getZoom();
    const roundedZoom = Math.round(z);
    const timeStep = timeSteps[roundedZoom] || 25;
    const nextTick = Math.max(25, timeStep / this.speed);
    return nextTick;
  }

  /**
   * Set the current time, it triggers a rendering of the trajectories.
   * @param {dateString | value} time
   */
  setCurrTime(time) {
    const newTime = new Date(time);
    this.currTime = newTime;
    this.lastUpdateTime = new Date();
    if (
      !this.map.isMoving() &&
      !this.map.isRotating() &&
      !this.map.isZooming()
    ) {
      const canvas = this.map.getCanvas();
      this.tracker.renderTrajectories(
        this.currTime,
        [canvas.width, canvas.height],
        getResolution(this.map),
      );
    }
  }

  /**
   * Set the speed.
   * @param {number} speed
   */
  setSpeed(speed) {
    this.speed = speed;
    this.start();
  }

  /**
   * Trackerlayer is started
   * @param {ol.map} map {@link https://openlayers.org/en/latest/apidoc/module-ol_Map-Map.html ol/Map}
   * @private
   */
  start() {
    this.stop();
    this.tracker.setVisible(true);
    const canvas = this.map.getCanvas();
    this.tracker.renderTrajectories(
      this.currTime,
      [canvas.width, canvas.height],
      getResolution(this.map),
    );
    this.startUpdateTime();
    this.currentZoom = this.map.getZoom();

    this.olEventsKeys = [
      this.map.on('moveend', () => {
        const z = this.map.getZoom();

        if (z !== this.currentZoom) {
          this.currentZoom = z;
          this.startUpdateTime();
        }
      }),
      this.map.on('mousemove', (evt) => {
        if (
          this.map.isMoving() ||
          this.map.isRotating() ||
          this.map.isZooming() ||
          !this.isHoverActive
        ) {
          this.map.getContainer().style.cursor = 'auto';
          return;
        }
        this.getVehiclesAtCoordinate(
          fromLonLat([evt.lngLat.lng, evt.lngLat.lat]),
        );
      }),
    ];
    this.getVehicleAtCoordinateWorker.onmessage = (e) => {
      const [vehicle] = e.data;
      // eslint-disable-next-line no-console
      console.log(vehicle);
      this.map.getContainer().style.cursor = vehicle ? 'pointer' : 'auto';
      this.tracker.setHoverVehicleId(vehicle && vehicle.id);
    };
  }

  /**
   * Stop current layer,.
   * @private
   */
  stop() {
    this.stopUpdateTime();
    if (this.tracker) {
      this.tracker.setVisible(false);
      this.tracker.clear();
    }
    unByKey(this.olEventsKeys);
    this.olEventsKeys = [];
  }

  /**
   * Set the filter for tracker features.
   * @param {Function} filter Filter function.
   */
  setFilter(filter) {
    if (this.tracker) {
      this.tracker.setFilter(filter);
    }
  }

  /**
   * Set the sort for tracker features.
   * @param {Function} sort Sort function.
   */
  setSort(sort) {
    if (this.tracker) {
      this.tracker.setSort(sort);
    }
  }

  getVehicle(filterFc) {
    return this.tracker.getTrajectories().filter(filterFc);
  }

  /**
   * Start to update the current time depending on the speed.
   * @private
   */
  startUpdateTime() {
    this.stopUpdateTime();
    this.updateTime = setInterval(() => {
      const newTime =
        this.currTime.getTime() +
        (new Date() - this.lastUpdateTime) * this.speed;
      this.setCurrTime(newTime);
    }, this.getRefreshTimeInMs());
  }

  /**
   * Stop to update time.
   * @private
   */
  stopUpdateTime() {
    clearInterval(this.updateTime);
  }

  /**
   * Returns the vehicle which are at the given coordinates.
   * Returns null when no vehicle is located at the given coordinates.
   * @param {ol.coordinate} coordinate
   * @returns {ol.feature | null} Vehicle feature
   * @private
   */
  getVehiclesAtCoordinate(coordinate) {
    const res = getResolution(this.map);

    // const ext = buffer([...coordinate, ...coordinate], 10 * res);
    const trajectories = this.tracker.getTrajectories();
    this.getVehicleAtCoordinateWorker.postMessage(
      JSON.stringify([trajectories, coordinate, res]),
    );
  }

  /**
   * Define the style of the vehicle.
   * Draw a blue circle with the id of the props parameter.
   *
   * @param {Object} props Properties
   * @private
   */
  style(props) {
    const { id: text } = props;
    if (this.styleCache[text]) {
      return this.styleCache[text];
    }
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 15;
    const ctx = canvas.getContext('2d');
    ctx.arc(8, 8, 5, 0, 2 * Math.PI, false);
    ctx.fillStyle = '#8ED6FF';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'black';
    ctx.stroke();
    ctx.font = 'bold 12px arial';
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 3;
    ctx.strokeText(text, 20, 10);
    ctx.fillStyle = 'black';
    ctx.fillText(text, 20, 10);
    this.styleCache[text] = canvas;
    return this.styleCache[text];
  }

  /**
   * Listens to click events on the layer.
   * @param {function} callback Callback function, called with the clicked
   *   features (https://openlayers.org/en/latest/apidoc/module-ol_Feature.html),
   *   the layer instance and the click event.
   */
  onClick(callback) {
    if (typeof callback === 'function') {
      if (!this.clickCallbacks.includes(callback)) {
        this.clickCallbacks.push(callback);
      }
    } else {
      throw new Error('callback must be of type function.');
    }
  }

  /**
   * Unlistens to click events on the layer.
   * @param {function} callback Callback function, called with the clicked
   *   features (https://openlayers.org/en/latest/apidoc/module-ol_Feature.html),
   *   the layer instance and the click event.
   */
  unClick(callback) {
    if (typeof callback === 'function') {
      const idx = this.clickCallbacks.indexOf(callback);
      if (idx >= -1) {
        this.clickCallbacks.splice(idx, 1);
      }
    }
  }
}

export default TrackerLayer;
