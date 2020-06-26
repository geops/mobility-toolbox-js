/**
 * This plugin:
 *  - adds a target="[MyTarget]" attribute to <a> tag generates for internal links.
 *  - if useWithReactRouter is true, replace dots by %20 in href attribute.
 *  - if useWithReactRouter is true, adds /api/ at the beginning of internal links to fits react-router route.
 */
class Plugin {
  onHandleConfig(evt) {
    this.options = {
      target: '_parent',
      useWithReactRouter: false,
      ...evt.data.option,
    };
  }

  onHandleContent(evt) {
    const { target, useWithReactRouter } = this.options;

    if (useWithReactRouter) {
      // https://regex101.com/r/3ssO6P/1
      const matches = [
        ...evt.data.content.matchAll(/<a href="((http){0}.*?)"/gm),
      ];

      matches.forEach((match) => {
        const oldHref = match[1];
        // React-router has problem with dots in url path because it thinks
        // it's a path to a real file,to avoid this we transform dots in
        // encoded spaces.
        // See in src/doc/Documentation.js how spaces are replaced by dots.
        const newHref = oldHref.replace(/\./g, '%20');

        // Add /api/ at the beginning of internals links to fits react-router path.
        // eslint-disable-next-line no-param-reassign
        evt.data.content = evt.data.content.replace(
          new RegExp(`<a href="${oldHref}"`, 'g'),
          `<a href="/api/${newHref}"`,
        );
      });
    }

    // eslint-disable-next-line no-param-reassign
    evt.data.content = evt.data.content.replace(
      /<a href="(http){0}/g,
      `<a target="${target}" href="`,
    );
  }
}

module.exports = new Plugin();
