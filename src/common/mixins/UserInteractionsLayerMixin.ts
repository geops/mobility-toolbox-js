/* eslint-disable no-empty-function,@typescript-eslint/no-empty-function */
/* eslint-disable no-useless-constructor,@typescript-eslint/no-useless-constructor */
/* eslint-disable no-unused-vars,@typescript-eslint/no-unused-vars */
/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */
// @ts-nocheck
import { fromLonLat } from 'ol/proj';
import { Coordinate } from 'ol/coordinate';
import { AnyMap, UserInteractionCallback } from '../../types';

export type UserInteractionsLayerMixinOptions = {
  userInteractions?: boolean;
  userClickInteractions?: boolean;
  userHoverInteractions?: boolean;
  defaultUserInteractions?: boolean;
  onClick?: UserInteractionCallback;
  onHover?: UserInteractionCallback;
};

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
  attachToMap(map: AnyMap) {}

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
  onClick(callback: UserInteractionCallback) {}

  /**
   * Subscribe on user:hover event.
   */
  onHover(callback: UserInteractionCallback) {}

  /**
   * Unsubscribe on user:click event.
   */
  unClick(callback: UserInteractionCallback) {}

  /**
   * Unsubscribe on user:hover event.
   */
  unHover(callback: UserInteractionCallback) {}
}

/**
 * Mixin for UserInteractionsLayerInterface. It provide onClick and onHover functions.
 *
 * @param {Class} Base A class to extend with {UserInteractionsLayerInterface} functionnalities.
 * @return {Class}  A class that implements {UserInteractionsLayerInterface} class and extends Base;
 * @private
 */
function UserInteractionsLayerMixin<T>(Base: T): T {
  // @ts-ignore
  return class extends Base {
    userInteractions: boolean;

    userClickInteractions: boolean;

    userHoverInteractions: boolean;

    defaultUserInteractions: boolean;

    userClickCallbacks: UserInteractionCallback[];

    userHoverCallbacks: UserInteractionCallback[];

    onFeatureClick?: UserInteractionCallback;

    onFeatureHover?: UserInteractionCallback;

    constructor(options: UserInteractionsLayerMixinOptions = {}) {
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

    attachToMap(map: AnyMap) {
      super.attachToMap(map);

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
    }

    detachFromMap() {
      super.detachFromMap();
    }

    /**
     * Listens to click events on the layer.
     * @param {function} callback Callback function, called with the clicked
     *   features,
     *   the layer instance and the click event.
     */
    onClick(callback: UserInteractionCallback) {
      this.userClickCallbacks.push(callback);
      this.activateUserInteractions();
    }

    /**
     * Listens to hover events on the layer.
     * @param {function} callback Callback function, called with the clicked
     *   features, the layer instance and the click event.
     */
    onHover(callback: UserInteractionCallback) {
      this.userHoverCallbacks.push(callback);
      this.activateUserInteractions();
    }

    /**
     * Unlistens to click events on the layer.
     * @param {function} callback Callback function, called with the clicked
     *   features,
     *   the layer instance and the click event.
     */
    unClick(callback: UserInteractionCallback) {
      const index = this.userClickCallbacks.indexOf(callback);
      if (index !== -1) {
        return;
      }
      this.userClickCallbacks = this.userClickCallbacks.slice(index, 1);
    }

    /**
     * Unlistens to hover events on the layer.
     * @param {function} callback Callback function, called with the clicked
     *   features, the layer instance and the click event.
     */
    unHover(callback: UserInteractionCallback) {
      const index = this.userHoverCallbacks.indexOf(callback);
      if (index !== -1) {
        return;
      }
      this.userHoverCallbacks = this.userHoverCallbacks.slice(index, 1);
    }

    /**
     * Function triggered when the user click the map.
     * @private
     */
    onUserClickCallback(
      evt:
        | { coordinate: Coordinate }
        | mapboxgl.MapLayerMouseEvent
        | maplibregl.MapMouseEvent,
    ) {
      return this.onUserActionCallback(evt, this.userClickCallbacks);
    }

    /**
     * Function triggered when the user move the cursor.
     * @private
     */
    onUserMoveCallback(
      evt:
        | { coordinate: Coordinate }
        | mapboxgl.MapLayerMouseEvent
        | maplibregl.MapMouseEvent,
    ) {
      return this.onUserActionCallback(evt, this.userHoverCallbacks);
    }

    onUserActionCallback(
      evt: { coordinate: Coordinate } | { lngLat: maplibregl.LngLat },
      callbacks,
    ) {
      const coordinate =
        (evt as { coordinate: Coordinate }).coordinate ||
        fromLonLat(
          (evt as { lngLat: maplibregl.LngLat }).lngLat.toArray() as Coordinate,
        );
      const emptyFeatureInfo = {
        features: [],
        layer: this,
        coordinate,
        event: evt,
      };

      return this.getFeatureInfoAtCoordinate(coordinate)
        .then((featureInfo) => {
          callbacks.forEach((callback) => {
            const { features, layer, coordinate: coord } = featureInfo;
            callback(features, layer, coord);
          });
          return featureInfo;
        })
        .catch(() => emptyFeatureInfo);
    }

    activateUserInteractions() {}

    deactivateUserInteractions() {}
  };
}

export default UserInteractionsLayerMixin;
