import BaseEvent from 'ol/events/Event';
import { Layer } from 'ol/layer';
import { EventsKey } from 'ol/events';
import { Map, getUid } from 'ol';
import { ObjectEvent } from 'ol/Object';
import type { Options } from 'ol/layer/Layer';
import getLayersAsFlatArray from '../../common/utils/getLayersAsFlatArray';

export type PropertiesLayerMixinOptions = Options & {
  key?: string;
  name?: string;
  group?: string;
  copyrights?: string[];
  children?: any[];
  visible?: boolean;
  disabled?: boolean;
  hitTolerance?: number;
  properties?: { [x: string]: any };
  map?: Map;
} & {
  [x: string]: any;
};

/**
 * This mixin adds some properties to access some ol properties easily ansd also
 * the management of a hierarchy of layers using children, parent and group property.
 */
function PropertiesLayerMixin(Base: typeof Layer) {
  return class extends Base {
    public options?: PropertiesLayerMixinOptions = {};

    public olListenersKeys: EventsKey[] = [];

    get children(): Layer[] {
      return this.get('children') || [];
    }

    set children(newValue: Layer[]) {
      this.set('children', newValue || []);
    }

    get copyrights(): string {
      // eslint-disable-next-line no-console
      console.warn('Deprecated. Use the source object to get the attributions');
      return this.get('copyrights');
    }

    set copyrights(newCopyrights: string | string[]) {
      // eslint-disable-next-line no-console
      console.warn('Deprecated. Use the source object to set the attributions');
      const arrValue =
        newCopyrights && !Array.isArray(newCopyrights)
          ? [newCopyrights]
          : newCopyrights;
      this.set('copyrights', arrValue || []);
    }

    get disabled(): boolean {
      return this.get('disabled');
    }

    set disabled(newValue: boolean) {
      this.set('disabled', newValue);
    }

    get group(): string {
      return this.get('group');
    }

    get hitTolerance(): boolean {
      // eslint-disable-next-line no-console
      console.warn(
        'Deprecated. Pass the pixelTolerance when you request the features.',
      );
      return this.get('hitTolerance') || 5;
    }

    get key(): string {
      return this.get('key') || this.get('name') || getUid(this);
    }

    get map(): Map {
      return this.getMapInternal() as Map;
    }

    get name(): string {
      return this.get('name');
    }

    get olLayer(): Layer {
      // eslint-disable-next-line no-console
      console.warn(
        "Deprecated property: mobility-toolbox-js/ol layers inherits now from ol/layer/Layer class. This getter is only a redirect to the current 'this' object.",
      );
      return this;
    }

    // eslint-disable-next-line class-methods-use-this
    set olLayer(newValue: Layer) {
      // eslint-disable-next-line no-console
      console.log(
        'Deprecated property: mobility-toolbox-js/ol layers inherits now from ol/layer/Layer class. This setter has no effect.',
      );
    }

    get parent(): Layer {
      return this.get('parent');
    }

    set parent(newValue: Layer) {
      this.set('parent', newValue);
    }

    get visible(): boolean {
      return this.getVisible();
    }

    set visible(newValue: boolean) {
      this.setVisible(newValue);
    }

    constructor(options: PropertiesLayerMixinOptions) {
      super(options);

      if (options.properties) {
        // eslint-disable-next-line no-console
        console.warn(
          "Deprecated. Don't use properties options. Pass the values directly in options object.",
        );
        this.setProperties(options.properties);
      }

      this.olListenersKeys?.push(
        // Update parent property
        this.on('propertychange', (evt: ObjectEvent) => {
          if (evt.key === 'children') {
            this.onChildrenChange(evt.oldValue);
          }
        }),

        // Manage group visiblity
        this.on('change:visible', () => {
          this.onVisibleChange();
        }),

        // Listen for group visiblity change
        // if a layer from a group is newly visible we hide the others.
        // @ts-ignore
        this.on(`change:visible:group`, (evt) => {
          // We hide layer of the same group
          if (
            this.group === evt.target.group &&
            this !== evt.target &&
            this.visible
          ) {
            this.visible = false;
            // Propagate event to parent
          } else if (this.children) {
            this.children.forEach((child) => child.dispatchEvent(evt));
          }
        }),
      );

      this.options = options;
      this.children = options.children || []; // Trigger the on children change event
    }

    setMapInternal(map: Map) {
      super.setMapInternal(map);
      if (map) {
        this.attachToMap(map);
      } else {
        this.detachFromMap();
      }
    }

    /** @private */
    onChildrenChange(oldValue: Layer[]) {
      // Set the parent property
      (oldValue || []).forEach((child) => {
        child.set('parent', undefined);
      });
      (this.children || []).forEach((child) => {
        child.set('parent', this);
      });
    }

    /** @private */
    onVisibleChange() {
      const parent = this.get('parent');
      const children = this.get('children') || [];

      if (this.getVisible()) {
        const group = this.get('group');

        // We make the parent visible
        if (parent) {
          parent.setVisible(true);
        }

        // If children doesn't contain any visible layers, we display all children.
        if (children && !children.some((child: Layer) => child.getVisible())) {
          children.forEach((child: Layer) => {
            child.setVisible(true);
          });
        }

        // Warn the same group that a new layer is visible
        if (parent && group) {
          // We search for the higher parent then it will dispatch to all the tree.
          let higherParent = parent;

          while (higherParent.get('parent')) {
            higherParent = higherParent.get('parent');
          }
          const evt = new BaseEvent(`change:visible:group`);
          evt.target = this;
          higherParent.dispatchEvent(evt);
        }
      } else {
        // We hide all the children
        children.forEach((child: Layer) => {
          child.setVisible(false);
        });

        // If the parent has no more visible child we also hide it.
        if (
          parent?.getVisible() &&
          !parent?.get('children').find((child: Layer) => child.getVisible())
        ) {
          parent.setVisible(false);
        }
      }
    }

    /**
     * Initialize the layer with the map passed in parameters.
     *
     * @param {ol/Map~Map} map A map.
     */
    attachToMap(map: Map) {
      // @ts-ignore
      (super.attachToMap || (() => {}))(map);

      (this.get('children') || []).forEach((child: Layer) => {
        map.addLayer(child);
      });
    }

    /**
     * Terminate what was initialized in init function. Remove layer, events...
     */
    detachFromMap() {
      (this.get('children') || []).forEach((child: Layer) => {
        this.map.removeLayer(child);
      });
      // @ts-ignore
      (super.detachFromMap || (() => {}))(map);
    }

    /**
     * Return the an array containing all the descendants of the layer in a flat array. Including the current layer.
     */
    flat() {
      return getLayersAsFlatArray(this);
    }
  };
}

export default PropertiesLayerMixin;
