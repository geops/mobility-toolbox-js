import { ControlPosition, IControl } from 'maplibre-gl';
import { getMapboxMapCopyrights } from '../../common/utils';

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

  onAdd(map: maplibregl.Map) {
    this.map = map;
    this.container = document.createElement('div');
    this.container.className = 'maplibregl-ctrl maplibregl-ctrl-attrib';
    this.render = this.render.bind(this);
    this.map.on('idle', this.render);
    // this.map.on('sourcedata', this.render);
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
  }

  // eslint-disable-next-line class-methods-use-this
  getDefaultPosition(): ControlPosition {
    return 'bottom-right';
  }

  render() {
    if (this.map && this.container) {
      const content = getMapboxMapCopyrights(this.map).join(' | ');
      if (content !== this.content) {
        this.content = content;
        this.container.innerHTML = this.content;
      }
    }
  }
}

export default CopyrightControl;
