const CopyrightMixin = (Base) =>
  class extends Base {
    addCopyrightContainer() {
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

      this.targetElement.appendChild(this.copyrightElement);
      this.renderCopyrights();
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
      super.deactivate();
      this.targetElement.removeChild(this.copyrightElement);
    }
  };

export default CopyrightMixin;
