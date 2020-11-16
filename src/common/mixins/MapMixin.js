/* eslint-disable no-empty-function */
/* eslint-disable no-useless-constructor */
/* eslint-disable no-unused-vars */
/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */

import { Map as MBMap } from 'mapbox-gl';
import MapboxLayer from '../../ol/layers/MapboxLayer';
import CopyrightUtils from '../CopyrightUtils';

/**
 * MapInterface.
 *
 * @classproperty {Object} options Map options.
 */
export class MapInterface {
  /**
   * Constructor.
   *
   * @param {Object} options Map options
   */
  constructor(options = {}) {}

  /**
   * Returns a list of mobility layers.
   * @returns {Layer[]}
   */
  getMobilityLayers() {}
}

/**
 * Mixin for MapInterface.
 * @ignore
 */
const MapMixin = (Base) =>
  class extends Base {
    updateCopyrights() {
      let copyrights = [];
      let target = null;

      // add copyrights from mapbox map
      if (this instanceof MBMap) {
        target = this.getContainer();
        copyrights = CopyrightUtils.getMapCopyrights(this);
      } else {
        target = this.getTargetElement();
      }

      // add copyrights from layers
      this.getMobilityLayers()
        .filter((l) => l.copyrights)
        .forEach((l) => {
          copyrights = copyrights.concat(l.copyrights);
        });

      // remove duplicates and empty values
      copyrights = [...new Set(copyrights.filter((c) => c.trim()))];

      // add copyrights to map
      if (!this.copyrightContainer) {
        this.copyrightContainer = document.createElement('div');
        this.copyrightContainer.id = 'mb-copyrght';
        target.appendChild(this.copyrightContainer);

        Object.assign(this.copyrightContainer.style, {
          position: 'absolute',
          bottom: 0,
          right: 0,
          fontSize: '10px',
          padding: '0 10px',
          backgroundColor: 'rgba(255, 255, 255, 0.5)',
        });
      }

      this.copyrightContainer.innerHTML = copyrights.join(' | ');
    }
  };

export default MapMixin;
