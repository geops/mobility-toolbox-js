import { MapEvent } from 'ol';
import { inView } from 'ol/layer/Layer';
import { FrameState } from 'ol/PluggableMap';
import CopyrightControlCommon from '../../common/controls/CopyrightControlCommon';
import removeDuplicate from '../../common/utils/removeDuplicate';

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
 * const control = new CopyrightControl();
 * control.attachToMap(map)
 *
 *
 * @see <a href="/example/ol-copyright">Openlayers copyright example</a>
 *
 * @extends {CopyrightControlCommon}
 */
class CopyrightControl extends CopyrightControlCommon {
  frameState?: FrameState;

  constructor(options: any) {
    super(options);
    this.onPostRender = this.onPostRender.bind(this);
  }

  getCopyrights() {
    if (!this.frameState) {
      return [];
    }
    let copyrights: string[] = [];

    // This code loop comes mainly from ol.
    this.frameState?.layerStatesArray.forEach((layerState: any) => {
      const { layer } = layerState;
      if (
        this.frameState &&
        inView(layerState, this.frameState.viewState) &&
        layer &&
        layer.getSource &&
        layer.getSource() &&
        layer.getSource().getAttributions()
      ) {
        copyrights = copyrights.concat(
          layer.getSource().getAttributions()(this.frameState),
        );
      }
    });
    return removeDuplicate(copyrights);
  }

  activate() {
    super.activate();
    if (this.map) {
      this.map.on('postrender', this.onPostRender);
    }
  }

  deactivate() {
    if (this.map) {
      this.map.un('postrender', this.onPostRender);
    }
  }

  onPostRender(evt: MapEvent) {
    if (this.map && this.element) {
      /**
       * @ignore
       */
      this.frameState = evt.frameState || undefined;
      this.render();
    }
  }
}

export default CopyrightControl;
