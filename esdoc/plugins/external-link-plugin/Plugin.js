/* eslint-disable no-underscore-dangle */
/* eslint-disable no-param-reassign */
/* eslint-disable class-methods-use-this */
/**
 * This plugin adds a target="[MyTarget]" attribute to <a> tag generates for externals.
 */
class Plugin {
  onHandleConfig(ev) {
    this._option = ev.data.option || {
      target: '_blank',
    };
  }

  onHandleContent(ev) {
    ev.data.content = ev.data.content.replace(
      /<a href="http/g,
      `<a target="${this._option.target}" href="http`,
    );
  }
}

module.exports = new Plugin();
