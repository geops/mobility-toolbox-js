/* eslint-disable max-classes-per-file */
import ControlCommon from './ControlCommon';

/**
 * A class representing a copyright control to display on map.
 * This class only draw an html element, with an empty string in it.
 * Use subclasses to use it in an ol or mapbox map.
 */
class CopyrightControlCommon extends ControlCommon {
  render() {
    if (!this.element) {
      return;
    }
    this.element.innerHTML = this.active
      ? this.getCopyrights().join(' | ')
      : '';
  }

  createDefaultElement() {
    this.element = document.createElement('div');
    this.element.id = 'mbt-copyright';
    Object.assign(this.element.style, {
      position: 'absolute',
      bottom: 0,
      right: 0,
      fontSize: '.8rem',
      padding: '0 10px',
    });
  }

  getCopyrights() {
    // eslint-disable-next-line no-console
    console.error(
      'The getCopyrights() function must be implemented in subclasses.',
      this,
    );
    return [] as string[];
  }
}

export default CopyrightControlCommon;
