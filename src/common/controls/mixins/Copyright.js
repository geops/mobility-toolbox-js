const CopyrightMixin = (Base) =>
  class extends Base {
    /**
     * Constructor
     * @param {Object} [options] Control options.
     * @param {HTMLElement} [options.targetElement = map.getTargetElement()] Container element where to locate the copyright.
     */
    constructor(map, options = {}) {
      super(map, options);
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
      this.renderAllCopyrights();
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

    renderAllCopyrights() {
      const copyrights = this.getCopyrights();
      this.copyrightElement.innerHTML = this.renderCopyrights(copyrights);
    }

    removeCopyrightContainer() {
      this.active = false;
      this.target.removeChild(this.copyrightElement);
    }
  };

export default CopyrightMixin;
