/**
 * This plugin adds a target="[MyTarget]" attribute to <a> tag generates for externals.
 */
class Plugin {
  onHandleConfig(evt) {
    this.options = evt.data.option || {
      target: '_blank',
    };
  }

  onHandleContent(evt) {
    const { target } = this.options;
    // eslint-disable-next-line no-param-reassign
    evt.data.content = evt.data.content.replace(
      /<a href="http/g,
      `<a target="${target}" href="http`,
    );
  }
}

module.exports = new Plugin();
