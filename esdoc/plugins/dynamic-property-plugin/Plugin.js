/* eslint-disable no-continue */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-restricted-syntax */
/**
 * This plugin a adds new tag `@classproperty`.
 */
const path = require('path');
const cheerio = require('cheerio');
const ParamParser = require('esdoc/out/src/Parser/ParamParser').default;
const DocBuilder = require('esdoc-publish-html-plugin/out/src/Builder/DocBuilder')
  .default;

const newTagName = '@classproperty';

class Plugin {
  // eslint-disable-next-line class-methods-use-this
  onHandleDocs(ev) {
    for (const doc of ev.data.docs) {
      if (doc.kind !== 'class') continue;
      if (!doc.unknown) continue;

      const props = doc.unknown.filter((v) => v.tagName === newTagName);
      if (!props.length) continue;

      for (const item of doc.unknown) {
        if (item.tagName === newTagName) {
          const matched = item.tagValue.match(
            /^\{(.*?)\} ([\w0-9_]+) -?(.*)$/m,
          );
          const type = matched[1];
          const name = matched[2];
          const desc = matched[3].trim();
          // console.log(item, type, name, desc, doc.longname);
          ev.data.docs.push({
            kind: 'member',
            name,
            memberof: doc.longname,
            static: false,
            longname: `${doc.longname}#${name}`,
            access: 'public',
            description: desc,
            lineNumber: doc.lineNumber,
            type: { types: [...type.split('|')] },
            __docId__: 395,
          });
        }
      }
    }
  }
}

module.exports = new Plugin();
