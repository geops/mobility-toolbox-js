import { AttributionControl } from 'mapbox-gl';
// import CommonControl from '../../common/controls/Control';
// import mixin from '../../common/mixins/CopyrightMixin';
// import getMapboxMapCopyrights from '../../common/utils/getMapboxMapCopyrights';
// import removeDuplicate from '../../common/utils/removeDuplicate';

class CopyrightControl extends AttributionControl {
  // _updateAttributions() {
  //   if (!this._map.style) return;
  // }
  // constructor(options) {
  //   super(options);
  // this.render = this.render.bind(this);
  // }
  // activate() {
  //   super.activate();
  //   if (this.map) {
  //     this.map.on('change:layers', this.render);
  //     this.map.on('change:mobilityLayers', this.render);
  //     this.map.once('load', this.render);
  //   }
  // }
  // deactivate() {
  //   if (this.map) {
  //     this.map.off('change:layers', this.render);
  //     this.map.off('change:mobilityLayers', this.render);
  //   }
  //   super.deactivate();
  // }
  // getCopyrights() {
  //   return removeDuplicate(
  //     super.getCopyrights().concat(getMapboxMapCopyrights(this.map)),
  //   );
  // }
}

export default CopyrightControl;
