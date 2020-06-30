/* eslint-disable class-methods-use-this */
class Map {
  isStyleLoaded() {}

  getBounds() {
    return {
      toArray: () => [1, 2],
    };
  }

  getCanvas() {
    return {
      height: '100px',
      width: '100px',
      setAttribute: () => {},
    };
  }

  getZoom() {}

  once() {}

  on() {}

  off() {}

  loaded() {}
}
module.exports = {
  Map,
};
