/* eslint-disable no-param-reassign */
/* eslint-disable class-methods-use-this */
/**
 * This plugin adds a target="_blank" attribute to <a> tag generates for externals.
 */
class Plugin {
  onHandleContent(ev) {
    ev.data.content = ev.data.content.replace(
      /<a href="http/g,
      '<a target="_blank" href="http',
    );
  }
}

module.exports = new Plugin();
