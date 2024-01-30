import { v4 as uuid } from 'uuid';
import { CustomLayerInterface, Evented } from 'maplibre-gl';
import { AnyMapboxMap } from '../../types';

export type LayerOptions = {
  id?: string;
  visible?: boolean;
  hitTolerance?: number;
};

/**
 * A class representing a layer to display on an Maplibre map.
 *
 * @example
 * import { Layer } from 'mobility-toolbox-js/mapbox';
 *
 * const layer = new Layer({ id:'MyLayer' });
 *
 * @implements {maplibregl.CustomLayer}
 * @extends {maplibregl.Evented}
 * @private
 */
class Layer extends Evented implements CustomLayerInterface {
  id: string;

  hitTolerance: number = 5;

  map: AnyMapboxMap | undefined;

  options: LayerOptions = {};

  type: 'custom' = 'custom';

  constructor(options: LayerOptions = {}) {
    super();
    this.options = options;
    this.id = options.id || uuid();
    this.type = 'custom';
    this.hitTolerance = 5;
  }

  onAdd(map: AnyMapboxMap, gl: WebGLRenderingContext | WebGL2RenderingContext) {
    this.attachToMap(map, gl);
  }

  onRemove() {
    this.detachFromMap();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  render(gl: WebGLRenderingContext | WebGL2RenderingContext) {}

  attachToMap(
    map: AnyMapboxMap,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    gl: WebGLRenderingContext | WebGL2RenderingContext,
  ) {
    this.map = map;
  }

  detachFromMap() {
    this.map = undefined;
  }

  /**
   * Create a copy of the Layer.
   * @param {Object} newOptions Options to override
   * @return {Layer} A Layer
   */
  clone(newOptions: LayerOptions = {}): Layer {
    return new Layer({ ...this.options, ...newOptions });
  }
}

export default Layer;
