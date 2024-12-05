import debounce from 'lodash.debounce';
import { Map } from 'ol';
import { Layer } from 'ol/layer';
import { ObjectEvent } from 'ol/Object';

import { MobilityLayerOptions } from '../layers/Layer';

let deprecated: (message: string) => void = () => {};
if (
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get('deprecated')
) {
  deprecated = debounce((message: string) => {
    // eslint-disable-next-line no-console
    console.warn(message);
  }, 1000);
}
const onChildrenChange = (layer: Layer, oldValue: Layer[]) => {
  // Set the parent property
  (oldValue || []).forEach((child) => {
    child.set('parent', undefined);
  });
  (layer.get('children') || []).forEach((child: Layer) => {
    child.set('parent', this);
  });
};

/**
 * obj function defines properties taht were used in mbt v2.
 * They are all marked als deprecated.
 * @param obj
 * @returns
 */
const defineDeprecatedProperties = (
  obj: Layer,
  options: MobilityLayerOptions,
) => {
  if (options.properties) {
    deprecated(
      "Deprecated. Don't use properties options. Pass the values directly in options object.",
    );
    obj.setProperties(options.properties);
  }

  // Update parent property
  obj.on('propertychange', (evt: ObjectEvent) => {
    if (evt.key === 'children') {
      onChildrenChange(evt.target, evt.oldValue);
    }

    if (evt.key === 'map') {
      const map = evt.target.get(evt.key);
      if (map) {
        (evt.target.get('children') || []).forEach((child: Layer) => {
          map.addLayer(child);
        });
      } else if (evt.oldValue) {
        (evt.target.get('children') || []).forEach((child: Layer) => {
          evt.oldValue.removeLayer(child);
        });
      }
    }
  });

  // Save options for cloning
  obj.set('options', options);

  obj.set('children', options.children || []); // Trigger the on children change event

  Object.defineProperties(obj, {
    children: {
      /** @deprecated */
      get: (): Layer[] => {
        deprecated(
          "Layer.children is deprecated. Use the Layer.get('children') method instead.",
        );
        return obj.get('children') || [];
      },

      /** @deprecated */
      set: (newValue: Layer[]) => {
        deprecated(
          "Layer.children is deprecated. Use the Layer.set('children', children) method instead.",
        );
        obj.set('children', newValue || []);
      },
    },
    copyrights: {
      /** @deprecated */
      get: (): string => {
        deprecated(
          'Layer.copyrights is deprecated. Get the attributions from the source object',
        );
        return obj.get('copyrights');
      },

      /** @deprecated */
      set: (newCopyrights: string | string[]) => {
        deprecated(
          'Layer.copyrights is deprecated. Set the attributions to the source object.',
        );
        const arrValue =
          newCopyrights && !Array.isArray(newCopyrights)
            ? [newCopyrights]
            : newCopyrights;
        obj.set('copyrights', arrValue || []);
      },
    },
    disabled: {
      /** @deprecated */
      get(): boolean {
        deprecated(
          "Layer.disabled is deprecated. Use the Layer.get('disabled') method instead.",
        );
        return obj.get('disabled');
      },

      /** @deprecated */
      set(newValue: boolean) {
        deprecated(
          "Layer.disabled is deprecated. Use the Layer.set('disabled', newValue) method instead.",
        );
        obj.set('disabled', newValue);
      },
    },
    group: {
      /** @deprecated */
      get(): string {
        deprecated(
          "Layer.group is deprecated. Use the Layer.get('group') method instead.",
        );
        return obj.get('group');
      },
    },
    hitTolerance: {
      /** @deprecated */
      get(): number {
        deprecated(
          'Layer.hitTolerance is deprecated. Pass the hitTolerance when you request the features.',
        );
        return obj.get('hitTolerance') || 5;
      },

      /** @deprecated */
      set(newValue: number) {
        deprecated(
          'Layer.hitTolerance is deprecated. Pass the hitTolerance when you request the features.',
        );
        obj.set('hitTolerance', newValue);
      },
    },
    key: {
      /** @deprecated */
      get(): string {
        deprecated(
          'Layer.key is deprecated. Use the Layer.get("key") method instead.',
        );
        return obj.get('key') || obj.get('name');
      },
    },
    map: {
      /** @deprecated */
      get(): Map | null {
        deprecated(
          'Layer.map is deprecated. Use the Layer.get("map") method instead.',
        );
        return obj.getMapInternal();
      },
    },
    name: {
      /** @deprecated */
      get(): string {
        deprecated(
          "Layer.name is deprecated. Use the Layer.get('name') method instead.",
        );
        return obj.get('name');
      },
    },
    olLayer: {
      /** @deprecated */
      get(): Layer {
        deprecated(
          "Layer.olLayer is deprecated. mobility-toolbox-js/ol layers inherits now from ol/layer/Layer class. obj getter is only a redirect to the current 'this' object.",
        );
        return obj as unknown as Layer;
      },

      /** @deprecated */
      set() {
        deprecated(
          'Layer.olLayer is deprecated. mobility-toolbox-js/ol layers inherits now from ol/layer/Layer class. obj setter has no effect.',
        );
      },
    },
    options: {
      /** @deprecated */
      get(): MobilityLayerOptions {
        deprecated(
          'Layer.options is deprecated. Use the Layer.get("options") method instead.',
        );
        return obj.get('options');
      },
      set(newValue: MobilityLayerOptions) {
        deprecated(
          'Layer.options is deprecated.  Use the Layer.set("options", newValue) method instead.',
        );
        return obj.set('options', newValue);
      },
    },
    parent: {
      /** @deprecated */
      get(): Layer {
        deprecated(
          "Layer.parent is deprecated. Use the Layer.get('parent') method instead.",
        );
        return obj.get('parent');
      },

      /** @deprecated */
      set(newValue: Layer) {
        deprecated(
          "Layer.parent is deprecated. Use the Layer.set('parent', parent) method instead.",
        );
        obj.set('parent', newValue);
      },
    },
    visible: {
      /** @deprecated */
      get(): boolean {
        deprecated(
          'Layer.visible is deprecated. Use the Layer.getVisible() method instead.',
        );
        return obj.getVisible();
      },

      /** @deprecated */
      set(newValue: boolean) {
        deprecated(
          'Layer.visible is deprecated. Use the Layer.setVisible(newValue) method instead.',
        );
        obj.setVisible(newValue);
      },
    },
  });
};

export default defineDeprecatedProperties;
