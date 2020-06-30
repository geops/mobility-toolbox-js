/**
 * This plugin creates custom buildin externals definitions so they don't appear in the sidebar of the doc.
 * This plugin is inspired by esdoc-external-webapi-plugin, see https://github.com/esdoc/esdoc-plugins/tree/master/esdoc-external-webapi-plugin
 */
const fs = require('fs-extra');
const path = require('path');

class Plugin {
  onHandleConfig(evt) {
    this.config = evt.data.config;
    this.options = evt.data.option || {};
    if (!('enable' in this.options)) this.options.enable = true;

    if (!this.options.enable) return;

    const srcPath = path.resolve(__dirname, 'externals.js');
    const outPath = path.resolve(this.config.source, '.externals.js');

    fs.copySync(srcPath, outPath);
  }

  onHandleDocs(evt) {
    const { enable } = this.options;
    const { source } = this.config;
    if (!enable) return;

    const outPath = path.resolve(source, '.externals.js');
    fs.removeSync(outPath);

    const name = `${path.basename(path.resolve(source))}/.externals.js`;

    evt.data.docs.forEach((doc) => {
      if (doc.kind === 'external' && doc.memberof === name)
        // eslint-disable-next-line no-param-reassign
        doc.builtinExternal = true;
    });

    const docIndex = evt.data.docs.findIndex(
      (doc) => doc.kind === 'file' && doc.name === name,
    );
    evt.data.docs.splice(docIndex, 1);
  }
}

module.exports = new Plugin();
