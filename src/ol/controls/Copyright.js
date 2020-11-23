import CommonCopyrightControl from '../../common/controls/Copyright';

class Copyright extends CommonCopyrightControl {
  activate(map) {
    super.activate(map, map.getTargetElement());
    this.renderCopyrights();
    map.on('change:layerGroup', () => this.renderCopyrights());
  }

  getCopyrights() {
    let copyrights = super.getCopyrights();

    this.map.getMobilityLayers().forEach((l) => {
      if (l.copyrights) {
        copyrights = copyrights.concat(l.copyrights);
      }
    });

    return copyrights;
  }
}

export default Copyright;
