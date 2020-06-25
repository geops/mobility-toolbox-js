/* eslint-disable no-underscore-dangle */
/* eslint-disable no-param-reassign */
/* eslint-disable class-methods-use-this */
/**
 * This plugin adds a target="[MyTarget]" attribute to <a> tag generates for internal classes.
 */
class Plugin {
  onHandleConfig(ev) {
    this._option = ev.data.option || {
      target: '_parent',
    };
  }

  onHandleContent(ev) {
    ev.data.content = ev.data.content.replace(
      /<a href="(http){0}/g,
      `<a target="${this._option.target}" href="`,
    );
  }
}

module.exports = new Plugin();
