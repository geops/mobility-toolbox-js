/* eslint-disable no-continue */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-restricted-syntax */
const path = require('path');
const cheerio = require('cheerio');
const ParamParser = require('esdoc/out/src/Parser/ParamParser').default;
const DocBuilder = require('esdoc-publish-html-plugin/out/src/Builder/DocBuilder')
  .default;

function supportDynamic(tag) {
  const results = [];
  console.log(tag);

  for (const item of tag.unknown) {
    console.log(item);
    if (item.tagName === '@dynamic') {
      const matched = item.tagValue.match(/^\{(.*?)\} ([\w0-9_]+) -?(.*)$/m);
      const type = matched[1];
      const name = matched[2];
      const desc = matched[3].trim();

      results.push({
        kind: 'member',
        name,
        memberof: tag.longname,
        static: false,
        longname: `${tag.longname}#${name}`,
        access: 'public',
        description: desc,
        lineNumber: tag.lineNumber,
        type: { types: [type] },
      });
    }
  }

  return results;
}

// exports.onHandleTag = function (ev) {
//   const tags = ev.data.tag;

//   for (const tag of tags) {
//     if (tag.kind === 'class') {
//       const dynamicTags = supportDynamic(tag);
//       ev.data.tag.push(...dynamicTags);
//     }
//   }
// };

class Plugin {
  constructor() {
    this._docs = null;
    this._reactPropsDocs = null;
  }

  onHandleDocs(ev) {
    this._docs = ev.data.docs;

    const reactPropsDocs = [];
    for (const doc of ev.data.docs) {
      console.log(doc);
      if (doc.kind !== 'class') continue;
      if (!doc.unknown) continue;

      const reactProps = doc.unknown.filter((v) => v.tagName === '@dynamic');
      if (!reactProps.length) continue;

      // reactPropsDocs.push({
      //   longname: doc.longname,
      //   fileName: `${doc.longname}.html`,
      //   reactProps,
      // });

      for (const item of doc.unknown) {
        if (item.tagName === '@dynamic') {
          const matched = item.tagValue.match(
            /^\{(.*?)\} ([\w0-9_]+) -?(.*)$/m,
          );
          const type = matched[1];
          const name = matched[2];
          const desc = matched[3].trim();
          console.log(item, type, name, desc, doc.longname);
          ev.data.docs.push({
            kind: 'member',
            name,
            memberof: doc.longname,
            static: false,
            longname: `${doc.longname}#${name}`,
            access: 'public',
            description: desc,
            lineNumber: doc.lineNumber,
            type: { types: [type] },
            __docId__: 395,
          });
        }
      }
    }
    console.log(ev.data.docs.length, reactPropsDocs);
    ev.data.docs = ev.data.docs;

    this._reactPropsDocs = reactPropsDocs;
  }

  onHandleContent(ev) {
    // const { content } = ev.data;
    // const { fileName } = ev.data;
    // // only html
    // if (path.extname(fileName) !== '.html') return;
    // // find target doc
    // const doc = this._reactPropsDocs.find((doc) => {
    //   const regexp = new RegExp(`${doc.fileName}$`);
    //   if (fileName.match(regexp)) return true;
    // });
    // console.log('###################### find doc', doc);
    // if (!doc) return;
    // console.log('###################### Create doc');
    // // create esdoc properties from react props
    // // const properties = [doc];
    // const properties = doc.reactProps.map((reactProp) => {
    //   const { typeText, paramName, paramDesc } = ParamParser.parseParamValue(
    //     reactProp.tagValue,
    //   );
    //   return ParamParser.parseParam(typeText, paramName, paramDesc);
    // });
    // // hack: create html
    // const docBuilder = DocBuilder.createDefaultBuilder();
    // const { html } = docBuilder._buildProperties(properties, 'React Props:');
    // // append html
    // const $ = cheerio.load(content);
    // $('.self-detail.detail').append(html);
    // ev.data.content = $.html();
  }
}

module.exports = new Plugin();
