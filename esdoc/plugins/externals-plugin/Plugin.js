/* eslint-disable no-restricted-syntax */
/* eslint-disable no-underscore-dangle */
/**
 * This plugin creates custom buildin externals definitions so they don't appear in the sidebar of the doc.
 * This plugin is inspired by esdoc-external-webapi-plugin, see https://github.com/esdoc/esdoc-plugins/tree/master/esdoc-external-webapi-plugin
 */
const fs = require('fs-extra');
const path = require('path');

class Plugin {
  onHandleConfig(ev) {
    this._config = ev.data.config;
    this._option = ev.data.option || {};
    if (!('enable' in this._option)) this._option.enable = true;

    if (!this._option.enable) return;

    const srcPath = path.resolve(__dirname, 'externals.js');
    const outPath = path.resolve(this._config.source, '.externals.js');

    fs.copySync(srcPath, outPath);
  }

  onHandleDocs(ev) {
    if (!this._option.enable) return;

    const outPath = path.resolve(this._config.source, '.externals.js');
    fs.removeSync(outPath);

    const name = `${path.basename(
      path.resolve(this._config.source),
    )}/.externals.js`;
    for (const doc of ev.data.docs) {
      if (doc.kind === 'external' && doc.memberof === name)
        doc.builtinExternal = true;
    }

    const docIndex = ev.data.docs.findIndex(
      (doc) => doc.kind === 'file' && doc.name === name,
    );
    ev.data.docs.splice(docIndex, 1);
  }
}

module.exports = new Plugin();
