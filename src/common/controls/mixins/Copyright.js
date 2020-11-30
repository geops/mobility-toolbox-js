/**
 * @param {Object} [options] Control options.
 * @param {HTMLElement} [options.targetElement = map.getTargetElement()] Container element where to locate the copyright.
 */
const CopyrightMixin = (Base) =>
  class extends Base {
    constructor(options = {}) {
      super(options);
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

    renderCopyrights() {
      const copyrights = this.getCopyrights();
      this.copyrightElement.innerHTML = copyrights.join(' | ');
    }

    removeCopyrightContainer() {
      this.target.removeChild(this.copyrightElement);
    }
  };

export default CopyrightMixin;
