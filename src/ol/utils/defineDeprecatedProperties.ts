import debounce from 'lodash.debounce';

import type { Map, Object as OLObject } from 'ol';
import type { EventsKey } from 'ol/events';
import type { Layer } from 'ol/layer';
import type BaseLayer from 'ol/layer/Base';
import type { ObjectEvent } from 'ol/Object';

import type { MobilityLayerOptions } from '../layers/Layer';

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
const onChildrenChange = (obj: OLObject, oldValue: OLObject[]) => {
  // Set the parent property
  (oldValue || []).forEach((child) => {
    child.set('parent', undefined);
  });
  ((obj.get('children') || []) as OLObject[]).forEach((child: OLObject) => {
    child.set('parent', obj);
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
      onChildrenChange(evt.target as Layer, evt.oldValue as Layer[]);
    }

    if (evt.key === 'map') {
      const map = (evt.target as OLObject).get(evt.key) as Map | null;
      if (map) {
        (
          ((evt.target as BaseLayer).get('children') as BaseLayer[]) || []
        ).forEach((child: BaseLayer) => {
          map.addLayer(child);
        });
      } else if (evt.oldValue) {
        (
          ((evt.target as BaseLayer).get('children') as BaseLayer[]) || []
        ).forEach((child: BaseLayer) => {
          (evt.oldValue as Map | null)?.removeLayer(child);
        });
      }
    }
  });

  // Save options for cloning
  obj.set('options', options);

  // Force triggering the on children property change event
  obj.set('children', [...((options.children as Layer[]) || [])]);

  Object.defineProperties(obj, {
    children: {
      /** @deprecated */
      get: (): Layer[] => {
        deprecated(
          "Layer.children is deprecated. Use the Layer.get('children') method instead.",
        );
        return (obj.get('children') as Layer[]) || [];
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
        return obj.get('copyrights') as string;
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
        return obj.get('disabled') as boolean;
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
        return obj.get('group') as string;
      },
    },
    hitTolerance: {
      /** @deprecated */
      get(): number {
        deprecated(
          'Layer.hitTolerance is deprecated. Pass the hitTolerance when you request the features.',
        );
        return (obj.get('hitTolerance') as number) || 5;
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
        return (obj.get('key') as string) || (obj.get('name') as string);
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
        return obj.get('name') as string;
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
    olListenersKeys: {
      /** @deprecated */
      get(): EventsKey[] {
        deprecated(
          'Layer.olListenersKeys is deprecated. Use the Layer.olEventsKeys instead.',
        );
        //@ts-expect-error Property just there for backward compatibility
        return (obj.olEventsKeys as EventsKey[]) || [];
      },
      set(newValue: string[]) {
        deprecated(
          'Layer.olListenersKeys is deprecated. Use the Layer.olEventsKeys instead.',
        );

        //@ts-expect-error Property just there for backward compatibility
        obj.olEventsKeys = newValue;
      },
    },
    options: {
      /** @deprecated */
      get(): MobilityLayerOptions {
        deprecated(
          'Layer.options is deprecated. Use the Layer.get("options") method instead.',
        );
        return obj.get('options') as MobilityLayerOptions;
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
        return obj.get('parent') as Layer;
      },

      /** @deprecated */
      set(newValue: Layer) {
        deprecated(
          "Layer.parent is deprecated. Use the Layer.set('parent', parent) method instead.",
        );
        obj.set('parent', newValue);
      },
    },
    properties: {
      /** @deprecated */
      get(): Record<string, unknown> {
        deprecated(
          'Layer.properties is deprecated. Use the Layer.getProperties() method instead.',
        );
        return obj.getProperties();
      },
      /** @deprecated */
      set(newValue: Record<string, unknown>) {
        deprecated(
          'Layer.properties is deprecated. Use the Layer.setProperties(newValue) method instead.',
        );
        obj.setProperties(newValue);
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
