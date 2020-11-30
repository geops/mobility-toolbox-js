/**
 * @param {ol/Map~Map|mapboxgl.Map} map Copyright's map.
 * @param {Object} [options] Copyright options.
 * @param {boolean} [options.active = true] Whether the copyright is active.
 * @param {function} [options.renderCopyrights = (copyrights) => copyrights.join(' | ')] Callback function to render copyrights.
 */
const CopyrightMixin = (Base) =>
  class extends Base {
    constructor(map, options = {}) {
      super(map, options);
      this.renderCopyrights = options.renderCopyrights
        ? options.renderCopyrights
        : (copyrights) => copyrights.join(' | ');
    }

    addCopyrightContainer(target) {
      this.target = target;
      this.copyrightElement = document.createElement('div');
      this.copyrightElement.id = 'mb-copyright';

      Object.assign(this.copyrightElement.style, {
        position: 'absolute',
        bottom: 0,
        right: 0,
        fontSize: '10px',
        padding: '0 10px',
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
      });

      this.target.appendChild(this.copyrightElement);
      this.render();
    }

    getCopyrights() {
      let copyrights = [];

      // add copyrights from layers
      this.map
        .getMobilityLayers()
        .filter((l) => l.copyrights)
        .forEach((l) => {
          copyrights = copyrights.concat(l.copyrights);
        });

      return [...new Set(copyrights.filter((c) => c.trim()))];
    }

    render() {
      const copyrights = this.getCopyrights();
      this.copyrightElement.innerHTML = this.renderCopyrights(copyrights);
    }

    removeCopyrightContainer() {
      this.target.removeChild(this.copyrightElement);
    }
  };

export default CopyrightMixin;
