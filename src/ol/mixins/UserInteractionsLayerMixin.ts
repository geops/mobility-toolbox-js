import { unByKey } from 'ol/Observable';
import { Map } from 'ol';
import { Layer } from 'ol/layer';
import { UserInteractionCallback } from '../../types';
import CommonUserInteractionsLayerMixin from '../../common/mixins/UserInteractionsLayerMixin';
import PropertiesLayerMixin, {
  PropertiesLayerMixinOptions,
} from './PropertiesLayerMixin';

export type UserInteractionsLayerMixinOptions = PropertiesLayerMixinOptions & {
  userInteractions?: boolean;
  userClickInteractions?: boolean;
  userHoverInteractions?: boolean;
  defaultUserInteractions?: boolean;
  onClick?: UserInteractionCallback;
  onHover?: UserInteractionCallback;
};

/**
 * This mixin provides onClick and onHover functions.
 *
 * @private
 */
function UserInteractionsLayerMixin(Base: typeof Layer) {
  return class extends CommonUserInteractionsLayerMixin(
    PropertiesLayerMixin(Base),
  ) {
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

export default UserInteractionsLayerMixin;
