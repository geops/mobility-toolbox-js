// @ts-nocheck
/* eslint-disable no-empty-function,@typescript-eslint/no-empty-function */
/* eslint-disable no-useless-constructor,@typescript-eslint/no-useless-constructor */
/* eslint-disable no-unused-vars,@typescript-eslint/no-unused-vars */
/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */
import { EventsKey } from 'ol/events';
import { unByKey } from 'ol/Observable';
import { Map } from 'ol';
import { AnyMap, UserInteractionCallback } from '../../types';
import UserInteractionsLayerMixin from '../../common/mixins/UserInteractionsLayerMixin';

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

type GConstructor<T = Layer> = new (...args: any[]) => T;
type GLayerConstructor = GConstructor<Layer>;

/**
 * Mixin for UserInteractionsLayerInterface. It provide onClick and onHover functions.
 *
 * @param {Class} Base A class to extend with {UserInteractionsLayerInterface} functionnalities.
 * @return {Class}  A class that implements {UserInteractionsLayerInterface} class and extends Base;
 * @private
 */
function OlUserInteractionsLayerMixin<UserInteractionsLayerMixin>(
  Base: UserInteractionsLayerMixin,
): UserInteractionsLayerMixin {
  // @ts-ignore
  return class extends UserInteractionsLayerMixin(Base) {
    private olListenersKeys: EventsKey[] = [];

    /**
     * Initialize the layer and listen to feature clicks.
     * @param {ol/Map~Map} map
     * @private
     */
    attachToMap(map: Map) {
      super.attachToMap(map);
      this.toggleVisibleListeners();
      this.olListenersKeys.push(
        // @ts-ignore
        this.on('change:visible', this.toggleVisibleListeners),
      );
    }

    /**
     * Terminate what was initialized in init function. Remove layer, events...
     */
    detachFromMap() {
      this.deactivateUserInteractions();
      unByKey(this.olListenersKeys);
      super.detachFromMap();
    }

    activateUserInteractions() {
      this.deactivateUserInteractions();
      if (
        this.map &&
        this.userInteractions &&
        this.userClickInteractions &&
        this.userClickCallbacks?.length
      ) {
        this.singleClickListenerKey = this.map.on(
          'singleclick',
          this.onUserClickCallback,
        );
        this.olListenersKeys.push(this.singleClickListenerKey);
      }
      if (
        this.map &&
        this.userInteractions &&
        this.userHoverInteractions &&
        this.userHoverCallbacks?.length
      ) {
        this.pointerMoveListenerKey = this.map.on(
          'pointermove',
          this.onUserMoveCallback,
        );
        this.olListenersKeys.push(this.pointerMoveListenerKey);
      }
    }

    deactivateUserInteractions() {
      unByKey([this.pointerMoveListenerKey, this.singleClickListenerKey]);
    }

    /**
     * Toggle listeners needed when a layer is avisible or not.
     * @private
     */
    toggleVisibleListeners() {
      if (this.getVisible()) {
        this.activateUserInteractions();
      } else {
        this.deactivateUserInteractions();
      }
    }
  };
}

export default OlUserInteractionsLayerMixin;
