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
    }

    addMobilityControl(control) {
      this.mobilityControls.push(control);
      // eslint-disable-next-line no-param-reassign
      control.map = this;
      // eslint-disable-next-line no-param-reassign
      control.active = true;
    }
  };

export default MapMixin;
