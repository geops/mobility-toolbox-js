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

  /**
   * Add a mobility Control to the map.
   * @param {Control} control control to add
   */
  addMobilityControl(control) {}

  /**
   * Remove a mobility Control to the map.
   * @param {Control} control control to remove
   */
  removeMobilityControl(control) {}
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
      control.activate(this);
    }

    removeMobilityControl(control) {
      control.deactivate(this);
      this.mobilityControls = this.mobilityControls.filter(
        (c) => c !== control,
      );
    }
  };

export default MapMixin;
