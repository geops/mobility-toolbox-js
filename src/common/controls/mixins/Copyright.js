/**
 * @param {ol/Map~Map|mapboxgl.Map} map Copyright's map.
 * @param {Object} [options] Copyright options.
 * @param {boolean} [options.active = true] Whether the copyright is active.
 * @param {HTMLElement} [options.targetElement = map.getTargetElement()] Container element where to locate the copyright.
 * @param {function} [options.renderCopyrights = (copyrights) => copyrights.join(' | ')] Callback function to render copyrights.
 */
const CopyrightMixin = (Base) =>
  class extends Base {
    defineProperties(opts) {
      super.defineProperties(opts);
      Object.defineProperties(this, {
        renderCopyrights: {
          value: opts.renderCopyrights
            ? opts.renderCopyrights
            : (copyrights) => copyrights.join(' | '),
          writable: true,
        },
      });
    }

    addCopyrightContainer(target) {
      this.target = this.options.targetElement || target;
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
      if (this.map.getMobilityLayers()) {
        this.render();
      }
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
