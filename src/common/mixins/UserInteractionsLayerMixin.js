/* eslint-disable no-empty-function,@typescript-eslint/no-empty-function */
/* eslint-disable no-useless-constructor,@typescript-eslint/no-useless-constructor */
/* eslint-disable no-unused-vars,@typescript-eslint/no-unused-vars */
/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */
import { fromLonLat } from 'ol/proj';
import { unByKey } from 'ol/Observable';

/**
 * UserInteractionsLayerInterface.
 */
export class UserInteractionsLayerInterface {
  /*
   * Constructor

   * @param {Object} options Layer options.
   * @param {string} options.userInteractions If true, it listens for user mouse hover and click event.
   * @param {string} options.userClickInteractions If true, it listens for user click event.
   * @param {string} options.userHoverInteractions If true, it listens for user mouse over event.
   * @param {string} options.defaultUserInteractions  If true, it adds default listeners for user mouse hover and click event.
   */
  constructor(options = {}) {}

  /**
   * Initialize the layer adding user interactions.
   *
   * @param {ol/Map~Map} map
   */
  attachToMap(map) {}

  /**
   * Terminate the layer unsubscribing user interactions.
   */
  detachFromMap() {}

  /**
   * Activate map listeners events.
   */
  activateUserInteractions() {}

  /**
   * Deactivate map listeners events.
   */
  deactivateUserInteractions() {}

  /**
   * Subscribe on user:click event.
   */
  onClick(callback) {}

  /**
   * Subscribe on user:hover event.
   */
  onHover(callback) {}

  /**
   * Unsubscribe on user:click event.
   */
  unClick(callback) {}

  /**
   * Unsubscribe on user:hover event.
   */
  unHover(callback) {}
}

/**
 * Mixin for UserInteractionsLayerInterface. It provide onClick and onHover functions.
 *
 * @param {Class} Base A class to extend with {UserInteractionsLayerInterface} functionnalities.
 * @return {Class}  A class that implements {UserInteractionsLayerInterface} class and extends Base;
 * @private
 */
const UserInteractionsLayerMixin = (Base) =>
  class extends Base {
    constructor(options = {}) {
      super(options);

      const {
        userInteractions = true,
        userClickInteractions = true,
        userHoverInteractions = true,
        defaultUserInteractions = true,
      } = options;

      this.userInteractions = userInteractions;
      this.userClickInteractions = userClickInteractions;
      this.userHoverInteractions = userHoverInteractions;
      this.defaultUserInteractions = defaultUserInteractions;
      this.userClickCallbacks = [];
      this.userHoverCallbacks = [];
      this.userClickEventsKeys = [];
      this.userHoverEventsKeys = [];
      this.onUserClickCallback = this.onUserClickCallback.bind(this);
      this.onUserMoveCallback = this.onUserMoveCallback.bind(this);

      // Add mouse event callbacks
      const { onClick, onHover } = options;

      if (this.userInteractions && this.userClickInteractions && onClick) {
        this.onClick(onClick);
      }

      if (this.userInteractions && this.userHoverInteractions && onHover) {
        this.onHover(onHover);
      }
    }

    attachToMap(map, options) {
      super.attachToMap(map, options);

      if (
        this.userInteractions &&
        this.defaultUserInteractions &&
        this.userClickInteractions &&
        this.onFeatureClick
      ) {
        this.onClick(this.onFeatureClick);
      }

      if (
        this.userInteractions &&
        this.defaultUserInteractions &&
        this.userHoverInteractions &&
        this.onFeatureHover
      ) {
        this.onHover(this.onFeatureHover);
      }
      this.listenEvents();
    }

    detachFromMap() {
      this.unlistenEvents();
      super.detachFromMap();
    }

    listenEvents() {
      this.unlistenEvents();
      this.userClickCallbacks.forEach((callback) => {
        this.userClickEventsKeys.push(
          this.on(
            'user:click',
            ({ target: { features, layer, coordinate } }) => {
              callback(features, layer, coordinate);
            },
          ),
        );
      });
      this.userHoverCallbacks.forEach((callback) => {
        this.userHoverEventsKeys.push(
          this.on(
            'user:hover',
            ({ target: { features, layer, coordinate, event } }) => {
              callback(features, layer, coordinate, event);
            },
          ),
        );
      });
    }

    unlistenEvents() {
      unByKey(this.userClickEventsKeys);
      unByKey(this.userHoverEventsKeys);
      this.userClickEventsKeys = [];
      this.userHoverEventsKeys = [];
    }

    /**
     * Listens to click events on the layer.
     * @param {function} callback Callback function, called with the clicked
     *   features,
     *   the layer instance and the click event.
     */
    onClick(callback) {
      this.userClickCallbacks.push(callback);
      this.activateUserInteractions();
      if (this.map) {
        // If the layer is already attached to the map we reload the events
        this.listenEvents();
      }
    }

    /**
     * Listens to hover events on the layer.
     * @param {function} callback Callback function, called with the clicked
     *   features, the layer instance and the click event.
     */
    onHover(callback) {
      this.userHoverCallbacks.push(callback);
      this.activateUserInteractions();
      if (this.map) {
        // If the layer is already attached to the map we reload the events
        this.listenEvents();
      }
    }

    /**
     * Unlistens to click events on the layer.
     * @param {function} callback Callback function, called with the clicked
     *   features,
     *   the layer instance and the click event.
     */
    unClick(callback) {
      const index = this.userClickCallbacks.indexOf(callback);
      if (index !== -1) {
        return;
      }
      this.userClickCallbacks = this.userClickCallbacks.slice(index, 1);

      if (this.map) {
        // If the layer is already attached to the map we reload the events
        this.listenEvents();
      }
    }

    /**
     * Unlistens to hover events on the layer.
     * @param {function} callback Callback function, called with the clicked
     *   features, the layer instance and the click event.
     */
    unHover(callback) {
      const index = this.userHoverCallbacks.indexOf(callback);
      if (index !== -1) {
        return;
      }
      this.userHoverCallbacks = this.userHoverCallbacks.slice(index, 1);

      if (this.map) {
        // If the layer is already attached to the map we reload the events
        this.listenEvents();
      }
    }

    /**
     * Function triggered when the user click the map.
     * @private
     */
    onUserClickCallback(evt) {
      const coordinate = evt.coordinate || fromLonLat(evt.lngLat.toArray());
      const emptyFeatureInfo = {
        features: [],
        layer: this,
        coordinate,
        event: evt,
      };
      return this.getFeatureInfoAtCoordinate(coordinate)
        .then((featureInfo) => {
          this.dispatchEvent({
            type: 'user:click',
            target: featureInfo,
          });
          return featureInfo;
        })
        .catch(() => emptyFeatureInfo);
    }

    /**
     * Function triggered when the user move the cursor.
     * @private
     */
    onUserMoveCallback(evt) {
      const coordinate = evt.coordinate || fromLonLat(evt.lngLat.toArray());
      const emptyFeatureInfo = {
        features: [],
        layer: this,
        coordinate,
        event: evt,
      };

      return this.getFeatureInfoAtCoordinate(coordinate)
        .then((featureInfo) => {
          this.dispatchEvent({
            type: 'user:hover',
            target: featureInfo,
          });
          return featureInfo;
        })
        .catch(() => emptyFeatureInfo);
    }

    activateUserInteractions() {}

    deactivateUserInteractions() {}
  };

export default UserInteractionsLayerMixin;
