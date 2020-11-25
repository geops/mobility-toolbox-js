const CopyrightMixin = (Base) =>
  class extends Base {
    addCopyrightContainer(target) {
      this.target = target;
      this.copyrightElement = document.createElement('div');
      this.copyrightElement.id = 'mb-copyrght';

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
      super.deactivate();
      this.target.removeChild(this.copyrightElement);
    }
  };

export default CopyrightMixin;
