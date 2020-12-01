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
   * Returns the HTML element of the map.
   * @returns {HTMLElement}
   */
  getContainer() {}

  /**
   * Returns a list of mobility layers.
   * @returns {Layer[]}
   */
  getMobilityLayers() {}

  /**
   * Returns a list of mobility controls.
   * @returns {Control[]}
   */
  getMobilityControls() {}
}

/**
 * Mixin for MapInterface.
 * @ignore
 */
const MapMixin = (Base) =>
  class extends Base {
    constructor(options = {}) {
      super(options);
      this.mobilityLayers = [];
      this.mobilityControls = [];
    }

    getMobilityLayers() {
      return this.mobilityLayers;
    }

    getMobilityControls() {
      return this.mobilityControls;
    }

    addMobilityControl(control) {
      this.mobilityControls.push(control);
      // eslint-disable-next-line no-param-reassign
      control.map = this;
    }

    removeMobilityControl(control) {
      // eslint-disable-next-line no-param-reassign
      control.map = null;
      this.mobilityControls = this.mobilityControls.filter(
        (c) => c !== control,
      );
    }
  };

export default MapMixin;
