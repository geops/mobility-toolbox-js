// eslint-disable-next-line max-classes-per-file
import debounce from 'lodash.debounce';
import { getUid, Map } from 'ol';
import { EventsKey } from 'ol/events';
import { Layer } from 'ol/layer';
import { ObjectEvent } from 'ol/Object';

import getLayersAsFlatArray from '../../common/utils/getLayersAsFlatArray';

import type { Options } from 'ol/layer/Layer';

import type { Layerable } from './MobilityLayerMixin';

export type PropertiesLayerMixinOptions = {
  children?: any[];
  copyrights?: string[];
  disabled?: boolean;
  group?: string;
  hitTolerance?: number;
  key?: string;
  map?: Map;
  name?: string;
  properties?: Record<string, any>;
  visible?: boolean;
} & Options &
  Record<string, any>;

const deprecated = debounce((message: string) => {
  // eslint-disable-next-line no-console
  console.warn(message);
}, 1000);

/**
 * This mixin adds some properties to access ol custom properties easily.
 */
function PropertiesLayerMixin<TBase extends Layerable>(Base: TBase) {
  return class PropertiesLayer extends Base {
    public olEventsKeys: EventsKey[] = [];

    public options?: PropertiesLayerMixinOptions = {};

    constructor(...args: any[]) {
      const options = args[0];
      super(options);

      if (options.properties) {
        deprecated(
          "Deprecated. Don't use properties options. Pass the values directly in options object.",
        );
        this.setProperties(options.properties);
      }

      this.olEventsKeys?.push(
        // Update parent property
        this.on('propertychange', (evt: ObjectEvent) => {
          if (evt.key === 'children') {
            this.onChildrenChange(evt.oldValue);
          }
        }),
      );

      this.options = options;
      this.set('children', options.children || []); // Trigger the on children change event
    }

    /**
     * Initialize the layer with the map passed in parameters.
     *
     * @param {ol/Map~Map} map A map.
     */
    attachToMap(map: Map) {
      // @ts-expect-error
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
      // @ts-expect-error
      (super.detachFromMap || (() => {}))();
    }

    /**
     * Return the an array containing all the descendants of the layer in a flat array. Including the current layer.
     * @deprecated
     */
    flat() {
      deprecated(
        'Layer.flat is deprecated. Use getLayersAsFlatArray utils method instead.',
      );
      return getLayersAsFlatArray(this);
    }

    /** @private */
    onChildrenChange(oldValue: Layer[]) {
      // Set the parent property
      (oldValue || []).forEach((child) => {
        child.set('parent', undefined);
      });
      (this.get('children') || []).forEach((child: Layer) => {
        child.set('parent', this);
      });
    }

    // @ts-expect-error  - this is a mixin
    override setMapInternal(map: Map) {
      super.setMapInternal(map);
      if (map) {
        this.attachToMap(map);
      } else {
        this.detachFromMap();
      }
    }

    /** @deprecated */
    get children(): Layer[] {
      deprecated(
        "Layer.children is deprecated. Use the Layer.get('children') method instead.",
      );
      return this.get('children') || [];
    }

    /** @deprecated */
    set children(newValue: Layer[]) {
      deprecated(
        "Layer.children is deprecated. Use the Layer.set('children', children) method instead.",
      );
      this.set('children', newValue || []);
    }

    /** @deprecated */
    get copyrights(): string {
      deprecated(
        'Layer.copyrights is deprecated. Get the attributions from the source object',
      );
      return this.get('copyrights');
    }

    /** @deprecated */
    set copyrights(newCopyrights: string | string[]) {
      deprecated(
        'Layer.copyrights is deprecated. Set the attributions to the source object.',
      );
      const arrValue =
        newCopyrights && !Array.isArray(newCopyrights)
          ? [newCopyrights]
          : newCopyrights;
      this.set('copyrights', arrValue || []);
    }

    /** @deprecated */
    get disabled(): boolean {
      deprecated(
        "Layer.disabled is deprecated. Use the Layer.get('disabled') method instead.",
      );
      return this.get('disabled');
    }

    /** @deprecated */
    set disabled(newValue: boolean) {
      deprecated(
        "Layer.disabled is deprecated. Use the Layer.set('disabled', newValue) method instead.",
      );
      this.set('disabled', newValue);
    }

    /** @deprecated */
    /** @deprecated */
    get group(): string {
      deprecated(
        "Layer.group is deprecated. Use the Layer.get('group') method instead.",
      );
      return this.get('group');
    }

    /** @deprecated */
    get hitTolerance(): number {
      deprecated(
        'Layer.hitTolerance is deprecated.Pass the hitTolerance when you request the features.',
      );
      return this.get('hitTolerance') || 5;
    }

    get key(): string {
      return this.get('key') || this.get('name') || getUid(this);
    }

    get map(): Map {
      return this.getMapInternal()!;
    }

    /** @deprecated */
    get name(): string {
      deprecated(
        "Layer.name is deprecated. Use the Layer.get('name') method instead.",
      );
      return this.get('name');
    }

    /** @deprecated */
    get olLayer(): Layer {
      deprecated(
        "Layer.olLayer is deprecated. mobility-toolbox-js/ol layers inherits now from ol/layer/Layer class. This getter is only a redirect to the current 'this' object.",
      );
      return this as unknown as Layer;
    }

    // eslint-disable-next-line class-methods-use-this
    set olLayer(newValue: Layer) {
      deprecated(
        'Layer.olLayer is deprecated. mobility-toolbox-js/ol layers inherits now from ol/layer/Layer class. This setter has no effect.',
      );
    }

    /** @deprecated */
    get parent(): Layer {
      deprecated(
        "Layer.parent is deprecated. Use the Layer.get('parent') method instead.",
      );
      return this.get('parent');
    }

    /** @deprecated */
    set parent(newValue: Layer) {
      deprecated(
        "Layer.parent is deprecated. Use the Layer.set('parent', parent) method instead.",
      );
      this.set('parent', newValue);
    }

    /** @deprecated */
    get visible(): boolean {
      deprecated(
        'Layer.visible is deprecated. Use the Layer.getVisible() method instead.',
      );
      return this.getVisible();
    }

    /** @deprecated */
    set visible(newValue: boolean) {
      deprecated(
        'Layer.visible is deprecated. Use the Layer.setVisible(newValue) method instead.',
      );
      this.setVisible(newValue);
    }
  };
}

export default PropertiesLayerMixin;
