/**
 * This plugin a adds new tag `@classproperty`.
 */
const path = require('path');
const cheerio = require('cheerio');
const ParamParser = require('esdoc/out/src/Parser/ParamParser').default;
const DocBuilder =
  require('esdoc-publish-html-plugin/out/src/Builder/DocBuilder').default;

const newTagName = '@classproperty';

class Plugin {
  // eslint-disable-next-line class-methods-use-this
  onHandleDocs(evt) {
    evt.data.docs
      .filter((doc) => {
        return (
          doc.kind === 'class' &&
          doc.unknown &&
          doc.unknown.filter((item) => item.tagName === newTagName).length
        );
      })
      .forEach((doc) => {
        doc.unknown.forEach((item) => {
          if (item.tagName === newTagName) {
            const matched = item.tagValue.match(
              /^\{(.*?)\} ([\w0-9_]+) -?(.*)$/m,
            );
            console.log(item, item.tagValue, matched);
            const type = matched[1];
            const name = matched[2];
            const desc = matched[3].trim();
            // console.log(item, type, name, desc, doc.longname);
            evt.data.docs.push({
              kind: 'member',
              name,
              memberof: doc.longname,
              static: false,
              longname: `${doc.longname}#${name}`,
              access: 'public',
              description: desc,
              lineNumber: doc.lineNumber,
              type: { types: [...type.split('|')] },
            });
          }
        });
      });
  }
}

module.exports = new Plugin();
