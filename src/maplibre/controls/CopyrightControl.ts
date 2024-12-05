import { ControlPosition, IControl } from 'maplibre-gl';

import { getMapGlCopyrights } from '../../common/utils';

/**
 * @private
 */
const DEFAULT_SEPARATOR = ' | ';

/**
 * Display layer's attributions trying to remove duplicated ones.
 *
 * @example
 * import { Map } from 'maplibre-gl';
 * import { CopyrightControl } from 'mobility-toolbox-js/maplibre';
 *
 * const map = new Map({
 *   container: 'map',
 *   style: `https://maps.geops.io/styles/travic_v2/style.json?key=${window.apiKey}`,
 * });
 *
 * const control = new CopyrightControl();
 * map.addControl(control);
 *
 *
 * @see <a href="/example/mb-realtime>MapLibre Realtime layer example</a>
 *
 * @implements {maplibregl.IControl}
 *
 * @public
 */
class CopyrightControl implements IControl {
  container?: HTMLElement;

  content?: string;

  map?: maplibregl.Map;

  options?: {
    customAttribution?: string | string[];
    separator?: string;
  };

  constructor(options = {}) {
    this.options = options;
  }

  // eslint-disable-next-line class-methods-use-this
  getDefaultPosition(): ControlPosition {
    return 'bottom-right';
  }

  onAdd(map: maplibregl.Map) {
    this.map = map;
    if (!this.container) {
      this.container = document.createElement('div');
    }
    this.render = this.render.bind(this);
    this.map.on('idle', this.render);
    this.map.on('sourcedata', this.render);
    this.map.on('styledata', this.render);
    this.render();
    return this.container;
  }

  onRemove() {
    if (this.container?.parentElement) {
      this.container.parentElement?.removeChild(this.container);
    }

    if (this.map) {
      this.map.off('sourcedata', this.render);
      this.map.off('styledata', this.render);
      this.map.off('idle', this.render);
    }
    this.map = undefined;

    return this.container;
  }

  render() {
    if (this.map && this.container) {
      const separator = this.options?.separator || DEFAULT_SEPARATOR;

      const attribs =
        this.options?.customAttribution || getMapGlCopyrights(this.map);
      const content = (Array.isArray(attribs) ? attribs : [attribs]).join(
        separator,
      );

      if (this.container.innerHTML !== content) {
        this.content = content;
        this.container.innerHTML = this.content;
      }
    }
  }
}

export default CopyrightControl;
