import { Evented } from 'maplibre-gl';
import { v4 as uuid } from 'uuid';

import type { CustomLayerInterface } from 'maplibre-gl';

import type { AnyMapGlMap } from '../../types';

export interface LayerOptions {
  id?: string;
}

export type CUSTOM = 'custom';

/**
 * A class representing a layer to display on an Maplibre map.
 *
 * @example
 * import { Layer } from 'mobility-toolbox-js/Maplibre';
 *
 * const layer = new Layer({ id:'MyLayer' });
 *
 * @implements {maplibregl.CustomLayerInterface}
 * @extends {maplibregl.Evented}
 * @private
 */
class Layer extends Evented implements CustomLayerInterface {
  id: string;

  map: AnyMapGlMap | undefined;

  options: LayerOptions = {};

  type: CUSTOM = 'custom';

  constructor(options: LayerOptions = {}) {
    super();
    this.options = options;
    this.id = options.id || uuid();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onAdd(map: AnyMapGlMap, gl: WebGL2RenderingContext | WebGLRenderingContext) {
    this.map = map;
  }

  onRemove(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    map: AnyMapGlMap,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    gl: WebGL2RenderingContext | WebGLRenderingContext,
  ) {
    this.map = undefined;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  render(gl: WebGL2RenderingContext | WebGLRenderingContext) {}
}

export default Layer;
