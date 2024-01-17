import { v4 as uuid } from 'uuid';
import BaseEvent from 'ol/events/Event';
// @ts-ignore
import { Layer } from 'ol/layer';
import { EventsKey } from 'ol/events';
import { Map } from 'ol';
import getLayersAsFlatArray from '../utils/getLayersAsFlatArray';
import type {
  LayerGetFeatureInfoOptions,
  LayerGetFeatureInfoResponse,
} from '../../types';

export type PropertiesLayerMixinOptions = {
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
};

type Constructor<T extends Layer> = new (...args: any[]) => T;
// type GLayerConstructor = Constructor<Layer>;

// export default <T extends Constructor>(base: T) =>
//   class SomeClass extends base {
//     something: boolean = false;
//   };

/**
 * A class representing a layer to display on map.
 *
 * @example
 * const layer = new Layer({
 *   name: 'My Layer',
 * });
 *
 * @classproperty {string} key - Identifier of the layer. Must be unique.
 * @classproperty {string} name - Name of the layer
 * @classproperty {string[]} copyrights - Array of copyrights.
 * @classproperty {Layer[]} children - List of children layers.
 * @classproperty {boolean} visible - Define if the layer is currently display on the map.
 * @classproperty {boolean} disabled - Define if the layer is currently display on the map but can't be seen (extent, zoom ,data restrictions).
 * @classproperty {number} hitTolerance - Hit-detection tolerance in css pixels. Pixels inside the radius around the given position will be checked for features.
 * @classproperty {Object} properties - Custom properties.
 * @classproperty {ol/Map~Map|mapboxgl.Map} map - The map where the layer is displayed.
 */
// @ts-ignore
function PropertiesLayerMixin<TBase extends Constructor<Layer>>(Base: TBase) {
  class PropertiesLayer extends Base {
    public key?: string;

    public name?: string;

    public group?: string;

    public copyrights?: string[];

    public children?: any[];

    public visible?: boolean;

    public disabled?: boolean;

    public hitTolerance?: number;

    public properties?: { [x: string]: any } = {};

    public map?: Map;

    public parent?: any;

    public options?: PropertiesLayerMixinOptions = {};

    public olListenersKeys?: EventsKey[] = [];

    /**
     * Constructor
     *
     * @param {Object} options
     * @param {string} [options.key=uuid()] Identifier of the layer. Muste be unique. Default use a generated uuid.
     * @param {string} [options.name] Name of the layer.
     * @param {string[]} [options.copyrights] Array of copyrights.
     * @param {Array<Layer>} [options.children=[]] Sublayers, all child layers will have a parent property associated to this layer.
     * @param {boolean} [options.visible=true]  Define if the layer is currently display on the map.
     * @param {boolean} [options.disabled=false] Define if the layer is currently display on the map but can't be seen (extent, zoom ,data restrictions).
     * @param {number} [options.hitTolerance=5] Hit-detection tolerance in css pixels. Pixels inside the radius around the given position will be checked for features.
     * @param {Object} [options.properties={}] Application-specific layer properties.
     */
    constructor(...args: any[]) {
      super(...args);
      const options = args[0] as PropertiesLayerMixinOptions;
      this.defineProperties(options);

      if (options.properties) {
        this.setProperties(options.properties);
      }

      this.options = options;

      this.name = options.name;

      this.key = options.key || options.name || uuid();

      this.visible = options.visible === undefined ? true : !!options.visible;

      this.group = options.group;

      this.copyrights = options.copyrights;

      this.children = options.children;

      this.hitTolerance = options.hitTolerance || 5;

      this.properties = { ...(options.properties || {}) };

      // Listen for group visiblity change
      // if a layer from a group is newly visible we hide the others.
      /* @ts-ignore */
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
      });
    }

    /**
     * Define layer's properties that needs custom get and set.
     *
     * @private
     */
    defineProperties(options: PropertiesLayerMixinOptions = {}) {
      Object.defineProperties(this, {
        /* Layer's information properties */
        name: {
          get: () => this.get('name'),
          set: (newName) => {
            this.set('name', newName);
          },
        },
        key: {
          get: () => this.get('key'),
          set: (newKey) => {
            this.set('key', newKey);
          },
        },
        group: {
          get: () => this.get('group'),
          set: (newGroup) => {
            this.set('group', newGroup);
          },
        },
        copyrights: {
          get: () => this.get('copyrights'),
          set: (newCopyrights) => {
            const arrValue =
              newCopyrights && !Array.isArray(newCopyrights)
                ? [newCopyrights]
                : newCopyrights;
            this.set('copyrights', arrValue || []);
          },
        },
        // options is used for clone function.
        options: {
          value: options,
        },
        map: {
          get: () => (this as Layer).getMapInternal(),
        },
        /* Layer's state properties */
        visible: {
          get: () => this.get('visible'),
          set: (newVisible) => {
            if (newVisible === this.visible) {
              return;
            }

            this.set('visible', newVisible);

            if (this.visible) {
              // We make the parent visible
              if (this.parent) {
                this.parent.visible = true;
              }

              // If children doesn't contain any visible layers, we display all children.
              if (
                this.children &&
                !this.children.some((child) => child.visible)
              ) {
                this.children.forEach((child) => {
                  // eslint-disable-next-line no-param-reassign
                  child.visible = true;
                });
              }

              // Warn the same group that a new layer is visible
              if (this.parent && this.group) {
                // We search for the higher parent then it will dispatch to all the tree.
                let higherParent = this.parent;

                while (higherParent.parent) {
                  higherParent = higherParent.parent;
                }
                const evt = new BaseEvent(`change:visible:group`);
                evt.target = this;
                higherParent.dispatchEvent(evt);
              }
            } else if (!this.visible) {
              // We hide all the children
              if (this.children) {
                this.children.forEach((child) => {
                  // eslint-disable-next-line no-param-reassign
                  child.visible = false;
                });
              }

              // If the parent has no more visible child we also hide it.
              if (
                this.parent &&
                this.parent.visible &&
                this.parent.children &&
                !this.parent.children.find(
                  (child: PropertiesLayer) => child.visible,
                )
              ) {
                this.parent.visible = false;
              }
            }
          },
        },
        disabled: {
          get: () => this.get('disabled'),
          set: (newValue) => {
            this.set('disabled', newValue);
          },
        },

        /* Layer's hierarchy properties */
        parent: {
          value: null,
          writable: true,
        },
        children: {
          get: () => this.get('children') || [],
          set: (newValue) => {
            (this.children || []).forEach((child) => {
              // eslint-disable-next-line no-param-reassign
              child.parent = undefined;
            });
            if (Array.isArray(newValue)) {
              newValue.forEach((child) => {
                // eslint-disable-next-line no-param-reassign
                child.parent = this;
              });
            }
            this.set('children', newValue || []);
          },
        },
      });
    }

    /**
     * Initialize the layer with the map passed in parameters.
     *
     * @param {ol/Map~Map} map A map.
     */
    attachToMap(map: Map) {
      this.detachFromMap();

      if (this.children) {
        this.children.forEach((child) => {
          child.attachToMap(map);
        });
      }
    }

    /**
     * Terminate what was initialized in init function. Remove layer, events...
     */
    // eslint-disable-next-line class-methods-use-this
    detachFromMap() {}

    /**
     * Request feature information for a given coordinate.
     * This function must be implemented by inheriting layers.
     *
     * @param {ol/coordinate~Coordinate} coordinate Coordinate.
     * @param {Object} options Some options. See child classes to see which are supported.
     * @return {Promise<FeatureInfo>} An empty response.
     */
    // eslint-disable-next-line no-unused-vars,@typescript-eslint/no-unused-vars
    getFeatureInfoAtCoordinate(
      coordinate: number[],
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      options?: LayerGetFeatureInfoOptions,
    ): Promise<LayerGetFeatureInfoResponse> {
      // eslint-disable-next-line no-console
      console.error(
        'getFeatureInfoAtCoordinate must be implemented by inheriting layers',
        this.key,
      );

      // This layer returns no feature info.
      // The function is implemented by inheriting layers.
      return Promise.resolve({
        layer: this,
        features: [],
        coordinate,
      });
    }

    /**
     * Return the an array containing all the descendants of the layer in a flat array. Including the current layer.
     */
    flat() {
      return getLayersAsFlatArray(this);
    }
  }

  return PropertiesLayer;
}

export default PropertiesLayerMixin;
