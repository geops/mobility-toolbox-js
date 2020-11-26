/* eslint-disable no-empty-function */
/* eslint-disable no-useless-constructor */
/* eslint-disable no-unused-vars */
/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */

import { Map as MBMap } from 'mapbox-gl';
import Observable from 'ol/Observable';
import MapboxLayer from '../../ol/layers/MapboxLayer';

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
   * @param {Object} options Map options
   * @param {Array<Control>} [options.mobilityControls] Custom controls of the map.
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
    constructor(options = {}) {
      super(options);
      this.mobilityControls = [];
      if (options.mobilityControls) {
        options.mobilityControls.forEach((control) => {
          this.addMobilityControl(control);
        });
      }
    }

    addMobilityControl(control) {
      this.mobilityControls.push(control);
      control.activate(this);
    }
  };

export default MapMixin;
