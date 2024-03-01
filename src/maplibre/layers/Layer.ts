import { v4 as uuid } from 'uuid';
import { CustomLayerInterface, Evented } from 'maplibre-gl';
import type { AnyMapGlMap } from '../../types';

export type LayerOptions = {
  id?: string;
};

/**
 * A class representing a layer to display on an Maplibre map.
 *
 * @example
 * import { Layer } from 'mobility-toolbox-js/Maplibre';
 *
 * const layer = new Layer({ id:'MyLayer' });
 *
 * @implements {maplibregl.CustomLayer}
 * @extends {maplibregl.Evented}
 * @private
 */
class Layer extends Evented implements CustomLayerInterface {
  id: string;

  map: AnyMapGlMap | undefined;

  options: LayerOptions = {};

  type: 'custom' = 'custom';

  constructor(options: LayerOptions = {}) {
    super();
    this.options = options;
    this.id = options.id || uuid();
    this.type = 'custom';
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onAdd(map: AnyMapGlMap, gl: WebGLRenderingContext | WebGL2RenderingContext) {
    this.map = map;
  }

  onRemove(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    map: AnyMapGlMap,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    gl: WebGLRenderingContext | WebGL2RenderingContext,
  ) {
    this.map = undefined;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  render(gl: WebGLRenderingContext | WebGL2RenderingContext) {}
}

export default Layer;