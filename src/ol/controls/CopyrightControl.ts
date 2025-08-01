import Control from 'ol/control/Control';
import { inView } from 'ol/layer/Layer';

import createDefaultCopyrightElement from '../../common/utils/createDefaultCopyrightElt';
import removeDuplicate from '../../common/utils/removeDuplicate';

import type { MapEvent } from 'ol';
import type { Options } from 'ol/control/Control';
import type { ViewStateLayerStateExtent } from 'ol/View';

export type CopyrightControlOptions = {
  className?: 'string';
  format?: (copyrights: string[]) => string;
} & Options;

/**
 * Display layer's copyrights. Adding the possibility to format them as you wish.
 *
 * @example
 * import { Map } from 'ol';
 * import { CopyrightControl } from 'mobility-toolbox-js/ol';
 *
 * const map = new Map({
 *   target: 'map',
 * });
 *
 * const control = new CopyrightControl();
 * map.addControl(control);
 *
 *
 * @see <a href="/example/ol-realtime>OpenLayers Realtime layer example</a>
 *
 * @extends {ol/control/Control~Control}
 *
 */
class CopyrightControl extends Control {
  format: (copyrights: string[]) => string;

  /**
   * Constructor.
   *
   * @param {Object} options
   * @param {Function} format Function used to format the list of copyrights available to a single string. By default join all the copyrights with a |.
   * @public
   */
  constructor(options: CopyrightControlOptions = {}) {
    const element = createDefaultCopyrightElement();
    element.className = options.className || 'mbt-copyright';
    super({
      element,
      ...options,
    });
    this.format =
      options.format ||
      ((copyrights) => {
        return copyrights?.join(' | ');
      });
  }

  render({ frameState }: MapEvent) {
    if (!frameState) {
      this.element.innerHTML = '';
      return;
    }
    let copyrights: string[] = [];

    // This code loop comes mainly from ol.
    frameState?.layerStatesArray.forEach((layerState) => {
      const { layer } = layerState;

      if (frameState && inView(layerState, frameState.viewState)) {
        const attribFunc = layer?.getSource()?.getAttributions();
        if (attribFunc) {
          copyrights = copyrights.concat(
            attribFunc(frameState as ViewStateLayerStateExtent),
          );
        }

        if (layer?.get('copyrights') as string[]) {
          let copyProp = layer.get('copyrights') as string[];
          copyProp = !Array.isArray(copyProp) ? [copyProp] : copyProp;
          if (copyProp?.length) {
            copyrights.push(...copyProp);
          }
        }
      }
    });
    const unique = removeDuplicate(copyrights) || [];
    this.element.innerHTML = this.format(unique);
  }
}

export default CopyrightControl;
