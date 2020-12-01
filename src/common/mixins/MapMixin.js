/* eslint-disable no-empty-function */
/* eslint-disable no-useless-constructor */
/* eslint-disable no-unused-vars */
/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */

import { Map as MBMap } from 'mapbox-gl';
import Observable from 'ol/Observable';
import Control from '../controls/Control';
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
      super({ ...options, layers: [], controls: [] });
      this.mobilityLayers = [];
      this.mobilityControls = [];

      // Add controls
      (options.controls || []).forEach((control) => {
        console.log('addControl');
        this.addControl(control);
      });

      // Add layers
      (options.layers || []).forEach((layer) => {
        this.addLayer(layer);
      });
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

    /** Documentation in inherited classes */
    addControl(control, position) {
      if (control instanceof Control) {
        this.addMobilityControl(control);
      } else {
        super.addControl(control, position);
      }
    }

    /** Documentation in inherited classes */
    removeControl(control) {
      if (control instanceof Control) {
        this.removeMobilityControl(control);
      } else {
        super.removeControl(control);
      }
    }
  };

export default MapMixin;
