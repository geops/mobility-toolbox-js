import { MapEvent } from 'ol';
import { inView } from 'ol/layer/Layer';
import Control, { Options } from 'ol/control/Control';
import removeDuplicate from '../../common/utils/removeDuplicate';
import createDefaultCopyrightElement from '../../common/utils/createDefaultCopyrightElt';

export type CopyrightControlOptions = Options & {
  className?: 'string';
};

/**
 * Display layer's copyrights.
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
 * @see <a href="/example/ol-copyright">Openlayers copyright example</a>
 *
 * @extends {CopyrightControlCommon}
 */
class CopyrightControl extends Control {
  constructor(options: CopyrightControlOptions = {}) {
    const element = createDefaultCopyrightElement();
    element.className = options.className || 'mbt-copyright';
    super({
      element,
      ...options,
    });
  }

  render({ frameState }: MapEvent) {
    if (!frameState) {
      this.element.innerHTML = '';
      return;
    }
    let copyrights: string[] = [];

    // This code loop comes mainly from ol.
    frameState?.layerStatesArray.forEach((layerState: any) => {
      const { layer } = layerState;
      if (
        frameState &&
        inView(layerState, frameState.viewState) &&
        layer &&
        layer.getSource &&
        layer.getSource() &&
        layer.getSource().getAttributions()
      ) {
        copyrights = copyrights.concat(
          layer.getSource().getAttributions()(frameState),
        );
      }
    });
    const unique = removeDuplicate(copyrights) || [];
    this.element.innerHTML = unique.join(' | ');
  }
}

export default CopyrightControl;
