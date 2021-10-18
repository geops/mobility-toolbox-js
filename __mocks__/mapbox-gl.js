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

  on() {}

  off() {}

  loaded() {}

  remove() {}

  unproject() {
    return { lng: 0, lat: 0 };
  }
}
module.exports = {
  Map,
};
