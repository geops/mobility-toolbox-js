/* eslint-disable no-empty-function,@typescript-eslint/no-empty-function */
/* eslint-disable no-useless-constructor,@typescript-eslint/no-useless-constructor */
/* eslint-disable no-unused-vars,@typescript-eslint/no-unused-vars */
/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */
import { fromLonLat } from 'ol/proj';
import { Coordinate } from 'ol/coordinate';
import { AnyMap, UserInteractionCallback } from '../../types';
import { FeatureInfo } from '../typedefs';
import getFeatureInfoAtCoordinate from '../../ol/utils/getFeatureInfoAtCoordinate';

export type UserInteractionsLayerMixinOptions = {
  userInteractions?: boolean;
  userClickInteractions?: boolean;
  userHoverInteractions?: boolean;
  defaultUserInteractions?: boolean;
  onClick?: UserInteractionCallback;
  onHover?: UserInteractionCallback;
};

/**
 * Mixin for UserInteractionsLayerInterface. It provide onClick and onHover functions.
 *
 * @param {Class} Base A class to extend with {UserInteractionsLayerInterface} functionnalities.
 * @return {Class}  A class that implements {UserInteractionsLayerInterface} class and extends Base;
 * @private
 */
function UserInteractionsLayerMixin(Base: any) {
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
      this.onUserClickCallback = this.onUserClickCallback.bind(this);
      this.onUserMoveCallback = this.onUserMoveCallback.bind(this);
      this.onFeatureClick = this.onFeatureClick?.bind(this);
      this.onFeatureHover = this.onFeatureHover?.bind(this);

      // Add mouse event callbacks
      const { onClick, onHover } = options;

      if (this.userInteractions && this.userClickInteractions) {
        if (onClick) {
          this.onClick(onClick);
        }

        if (this.defaultUserInteractions && this.onFeatureClick) {
          // this.onClick(this.onFeatureClick);
        }
      }

      if (this.userInteractions && this.userHoverInteractions) {
        if (onHover) {
          this.onHover(onHover);
        }
        if (this.defaultUserInteractions && this.onFeatureHover) {
          // this.onHover(this.onFeatureHover);
        }
      }
    }

    attachToMap(map: AnyMap) {
      super.attachToMap(map);
      if (this.userInteractions) {
        this.activateUserInteractions();
      }
    }

    detachFromMap() {
      this.deactivateUserInteractions();
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
      evt:
        | { coordinate: Coordinate }
        | mapboxgl.MapLayerMouseEvent
        | maplibregl.MapMouseEvent,
      callbacks: UserInteractionCallback[],
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

      let promise;
      // @ts-ignore
      if (this.getFeatureInfoAtCoordinate) {
        // @ts-ignore
        promise = this.getFeatureInfoAtCoordinate(coordinate);
      } else {
        // @ts-ignore
        promise = getFeatureInfoAtCoordinate(coordinate, [this]);
      }
      return promise
        .then((featureInfo: FeatureInfo) => {
          callbacks.forEach((callback) => {
            const { features, layer, coordinate: coord } = featureInfo;
            // @ts-ignore
            callback(features, layer, coord, evt);
          });
          return featureInfo;
        })
        .catch(() => emptyFeatureInfo);
    }

    activateUserInteractions() {
      // eslint-disable-next-line no-console
      console.warn(
        'The activateUserInteractions function must be implemented in subclasses',
      );
    }

    deactivateUserInteractions() {
      // eslint-disable-next-line no-console
      console.warn(
        'The deactivateUserInteractions function must be implemented in subclasses',
      );
    }
  };
}

export default UserInteractionsLayerMixin;
