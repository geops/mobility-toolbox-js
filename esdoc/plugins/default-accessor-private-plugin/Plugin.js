/**
 * This plugin a set default access to private.
 */
class Plugin {
  constructor() {
    this._docs = null;
    this._option = null;
  }

  onHandleDocs(ev) {
    const option = ev.data.option || {};
    const access = option.access;
    const autoPrivate = option.autoPrivate;
    for (const doc of ev.data.docs) {
      if (!doc.access) {
        if (autoPrivate && doc.name.charAt(0) === '_') {
          doc.access = 'private';
        } else {
          doc.access = 'private';
        }
      }
    }
  }
}

module.exports = new Plugin();
