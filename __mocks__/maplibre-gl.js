import { Evented } from 'maplibre-gl';

const callbacks = {};

/* eslint-disable class-methods-use-this */
class Map {
  constructor(options) {
    this.options = options;
  }

  addLayer() {}

  addSource() {}

  isStyleLoaded() {}

  getLayer() {}

  getBounds() {
    return {
      toArray: () => [
        [1, 2],
        [1, 2],
      ],
    };
  }

  getCanvas() {
    return {
      height: '100px',
      width: '100px',
      setAttribute: () => {},
      removeAttribute: () => {},
    };
  }

  getCenter() {
    return { lng: 0, lat: 0 };
  }

  getZoom() {}

  getBearing() {
    return 0;
  }

  once() {}

  on(type, func) {
    if (!callbacks[type]) {
      callbacks[type] = [];
    }
    callbacks[type].push(func);
  }

  off(type, func) {
    if (!callbacks[type]) {
      callbacks[type] = [];
    }
    const index = callbacks[type].indexOf(func);
    if (index > -1) {
      callbacks[type].splice(index, 1);
    }
  }

  fire(type, evt) {
    if (!callbacks[type]) {
      callbacks[type] = [];
    }
    callbacks[type].forEach((callback) => callback(evt));
  }

  loaded() {}

  remove() {}

  unproject() {
    return { lng: 0, lat: 0 };
  }
}
module.exports = {
  Map,
  Evented,
};
