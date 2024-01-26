import { ControlPosition, IControl } from 'maplibre-gl';
import { getMapboxMapCopyrights } from '../../common/utils';

/**
 * @private
 */
const DEFAULT_SEPARATOR = ' | ';

/**
 * Display layer's copyrights.
 *
 * @example
 * import { Map } from 'mapbox-gl';
 * import { CopyrightControl } from 'mobility-toolbox-js/mapbox';
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
 * @see <a href="/example/mb-copyright">Mapbox copyright example</a>
 *
 */
class CopyrightControl implements IControl {
  map?: maplibregl.Map;

  container?: HTMLElement;

  content?: string;

  options?: {
    customAttribution?: string | string[];
    separator?: string;
  };

  constructor(options = {}) {
    this.options = options;
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

  // eslint-disable-next-line class-methods-use-this
  getDefaultPosition(): ControlPosition {
    return 'bottom-right';
  }

  render() {
    if (this.map && this.container) {
      const separator = this.options?.separator || DEFAULT_SEPARATOR;

      const attribs =
        this.options?.customAttribution || getMapboxMapCopyrights(this.map);
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
