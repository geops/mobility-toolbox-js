/* eslint-disable no-restricted-syntax */
/* eslint-disable no-underscore-dangle */
import React from 'react';

// We had to copy the taffydb code here instead of loading the module because nextjs can't import the module properly
// so the taffydb.js file in this folder is a copy paste from taffydb@2.7.3 with a esm default export at the end.
import taffy from './taffydb';
import docss from './index.json';

/**
 * Load the config into a in memory db.
 * https://github.com/esdoc/esdoc-plugins/blob/2de5022baa569785a189056a99acd1d7ca8284b7/esdoc-publish-html-plugin/src/Plugin.js#L33
 */
export const _data = taffy(docss);

/**
 * Index used for the search.
 */
let searchIndex;

/**
 * find doc objects that is ordered.
 * https://github.com/esdoc/esdoc-plugins/blob/2de5022baa569785a189056a99acd1d7ca8284b7/esdoc-publish-html-plugin/src/Builder/DocBuilder.js#L117
 * @param {string} order - doc objects order(``column asec`` or ``column desc``).
 * @param {...Object} cond - condition objects
 * @returns {DocObject[]} found doc objects.
 * @private
 */
export const _orderedFind = (order, ...cond) => {
  const data = _data(...cond);

  if (order) {
    return data.order(`${order}, name asec`).map((v) => v);
  }
  return data.order('name asec').map((v) => v);
};

/**
 * find doc object.
 * https://github.com/esdoc/esdoc-plugins/blob/2de5022baa569785a189056a99acd1d7ca8284b7/esdoc-publish-html-plugin/src/Builder/DocBuilder.js#L36
 * @param {...Object} cond - find condition.
 * @returns {DocObject[]} found doc objects.
 * @private
 */
export const _find = (...cond) => {
  return _orderedFind(null, ...cond);
};

/**
 * find all identifiers with kind grouping.
 * https://github.com/esdoc/esdoc-plugins/blob/2de5022baa569785a189056a99acd1d7ca8284b7/esdoc-publish-html-plugin/src/Builder/DocBuilder.js#L46
 * @returns {{class: DocObject[], interface: DocObject[], function: DocObject[], variable: DocObject[], typedef: DocObject[], external: DocObject[]}} found doc objects.
 * @private
 */
export const _findAllIdentifiersKindGrouping = () => {
  const result = {
    class: _find([{ kind: 'class', interface: false }]),
    interface: _find([{ kind: 'class', interface: true }]),
    function: _find([{ kind: 'function' }]),
    variable: _find([{ kind: 'variable' }]),
    typedef: _find([{ kind: 'typedef' }]),
    external: _find([{ kind: 'external' }]).filter((v) => !v.builtinExternal),
  };
  return result;
};

/**
 * fuzzy find doc object by name.
 * https://github.com/esdoc/esdoc-plugins/blob/2de5022baa569785a189056a99acd1d7ca8284b7/esdoc-publish-html-plugin/src/Builder/DocBuilder.js#L63
 * - equal with longname
 * - equal with name
 * - include in longname
 * - include in ancestor
 *
 * @param {string} name - target identifier name.
 * @param {string} [kind] - target kind.
 * @returns {DocObject[]} found doc objects.
 * @private
 */
export const _findByName = (name, kind = null) => {
  let docs;

  if (kind) {
    docs = _orderedFind(null, { longname: name, kind });
  } else {
    docs = _orderedFind(null, { longname: name });
  }
  if (docs.length) return docs;

  if (kind) {
    docs = _orderedFind(null, { name, kind });
  } else {
    docs = _orderedFind(null, { name });
  }
  if (docs.length) return docs;

  const regexp = new RegExp(`[~]${name.replace('*', '\\*')}$`); // if name is `*`, need to escape.
  if (kind) {
    docs = _orderedFind(null, { longname: { regex: regexp }, kind });
  } else {
    docs = _orderedFind(null, { longname: { regex: regexp } });
  }
  if (docs.length) return docs;

  // inherited method?
  const matched = name.match(/(.*)[.#](.*)$/); // instance method(Foo#bar) or static method(Foo.baz)
  if (matched) {
    const parent = matched[1];
    const childName = matched[2];
    const parentDoc = _findByName(parent, 'class')[0];
    if (parentDoc && parentDoc._custom_extends_chains) {
      for (const superLongname of parentDoc._custom_extends_chains) {
        docs = _find({ memberof: superLongname, name: childName });
        if (docs.length) return docs;
      }
    }
  }

  return [];
};

/**
 * get file name of output html page.
 * https://github.com/esdoc/esdoc-plugins/blob/2de5022baa569785a189056a99acd1d7ca8284b7/esdoc-publish-html-plugin/src/Builder/DocBuilder.js#L555
 * @param {DocObject} doc - target doc object.
 * @returns {string} file name.
 * @private
 */
const _getOutputFileName = (doc) => {
  switch (doc.kind) {
    case 'variable':
      return 'variable/index.html';
    case 'function':
      return 'function/index.html';
    case 'member': // fall
    case 'method': // fall
    case 'constructor': // fall
    case 'set': // fall
    case 'get': {
      // fal
      const parentDoc = _find({ longname: doc.memberof })[0];
      return _getOutputFileName(parentDoc);
    }
    case 'external':
      return 'external/index.html';
    case 'typedef':
      return 'typedef/index.html';
    case 'class':
      return `class/${doc.longname}.html`;
    case 'file':
      return `file/${doc.name}.html`;
    case 'testFile':
      return `test-file/${doc.name}.html`;
    case 'test':
      return 'test.html';
    default:
      throw new Error('DocBuilder: can not resolve file name.');
  }
};

/**
 * gat url of output html page.
 * https://github.com/esdoc/esdoc-plugins/blob/2de5022baa569785a189056a99acd1d7ca8284b7/esdoc-publish-html-plugin/src/Builder/DocBuilder.js#L533
 * @param {DocObject} doc - target doc object.
 * @returns {string} url of output html. it is relative path from output root dir.
 * @private
 */
export const _getURL = (doc) => {
  let inner = false;
  if (
    [
      'variable',
      'function',
      'member',
      'typedef',
      'method',
      'constructor',
      'get',
      'set',
    ].includes(doc.kind)
  ) {
    inner = true;
  }

  if (inner) {
    const scope = doc.static ? 'static' : 'instance';
    const fileName = _getOutputFileName(doc);
    return `${fileName}#${scope}-${doc.kind}-${doc.name}`;
  }
  const fileName = _getOutputFileName(doc);
  return fileName;
};

/**
 * resolve class extends chain.
 * https://github.com/esdoc/esdoc-plugins/blob/2de5022baa569785a189056a99acd1d7ca8284b7/esdoc-publish-html-plugin/src/Builder/DocResolver.js#L146
 * add following special property.
 * - ``_custom_extends_chain``: ancestor class chain.
 * - ``_custom_direct_subclasses``: class list that direct extends target doc.
 * - ``_custom_indirect_subclasses``: class list that indirect extends target doc.
 * - ``_custom_indirect_implements``: class list that target doc indirect implements.
 * - ``_custom_direct_implemented``: class list that direct implements target doc.
 * - ``_custom_indirect_implemented``: class list that indirect implements target doc.
 *
 * @private
 */
export const _resolveExtendsChain = (docs) => {
  if (_data.__RESOLVED_EXTENDS_CHAIN__) return;

  const extendsChain = (doc) => {
    if (!doc.extends) return;

    const selfDoc = doc;

    // traverse super class.
    const chains = [];

    /* eslint-disable */
    while (1) {
      if (!doc.extends) break;

      let superClassDoc = _findByName(doc.extends[0])[0];

      if (superClassDoc) {
        // this is circular extends
        if (superClassDoc.longname === selfDoc.longname) {
          break;
        }

        chains.push(superClassDoc.longname);
        doc = superClassDoc;
      } else {
        chains.push(doc.extends[0]);
        break;
      }
    }

    if (chains.length) {
      // direct subclass
      let superClassDoc = _findByName(chains[0])[0];
      if (superClassDoc) {
        if (!superClassDoc._custom_direct_subclasses)
          superClassDoc._custom_direct_subclasses = [];
        superClassDoc._custom_direct_subclasses.push(selfDoc.longname);
      }

      // indirect subclass
      for (let superClassLongname of chains.slice(1)) {
        superClassDoc = _findByName(superClassLongname)[0];
        if (superClassDoc) {
          if (!superClassDoc._custom_indirect_subclasses)
            superClassDoc._custom_indirect_subclasses = [];
          superClassDoc._custom_indirect_subclasses.push(selfDoc.longname);
        }
      }

      // indirect implements and mixes
      for (let superClassLongname of chains) {
        superClassDoc = _findByName(superClassLongname)[0];
        if (!superClassDoc) continue;

        // indirect implements
        if (superClassDoc.implements) {
          if (!selfDoc._custom_indirect_implements)
            selfDoc._custom_indirect_implements = [];
          selfDoc._custom_indirect_implements.push(...superClassDoc.implements);
        }

        // indirect mixes
        //if (superClassDoc.mixes) {
        //  if (!selfDoc._custom_indirect_mixes) selfDoc._custom_indirect_mixes = [];
        //  selfDoc._custom_indirect_mixes.push(...superClassDoc.mixes);
        //}
      }

      // extends chains
      selfDoc._custom_extends_chains = chains.reverse();
    }
  };

  let implemented = (doc) => {
    let selfDoc = doc;

    // direct implemented (like direct subclass)
    for (let superClassLongname of selfDoc.implements || []) {
      let superClassDoc = _findByName(superClassLongname)[0];
      if (!superClassDoc) continue;
      if (!superClassDoc._custom_direct_implemented)
        superClassDoc._custom_direct_implemented = [];
      superClassDoc._custom_direct_implemented.push(selfDoc.longname);
    }

    // indirect implemented (like indirect subclass)
    for (let superClassLongname of selfDoc._custom_indirect_implements || []) {
      let superClassDoc = _findByName(superClassLongname)[0];
      if (!superClassDoc) continue;
      if (!superClassDoc._custom_indirect_implemented)
        superClassDoc._custom_indirect_implemented = [];
      superClassDoc._custom_indirect_implemented.push(selfDoc.longname);
    }
  };

  //var mixed = (doc) =>{
  //  var selfDoc = doc;
  //
  //  // direct mixed (like direct subclass)
  //  for (var superClassLongname of selfDoc.mixes || []) {
  //    var superClassDoc = _find({longname: superClassLongname})[0];
  //    if (!superClassDoc) continue;
  //    if(!superClassDoc._custom_direct_mixed) superClassDoc._custom_direct_mixed = [];
  //    superClassDoc._custom_direct_mixed.push(selfDoc.longname);
  //  }
  //
  //  // indirect mixed (like indirect subclass)
  //  for (var superClassLongname of selfDoc._custom_indirect_mixes || []) {
  //    var superClassDoc = _find({longname: superClassLongname})[0];
  //    if (!superClassDoc) continue;
  //    if(!superClassDoc._custom_indirect_mixed) superClassDoc._custom_indirect_mixed = [];
  //    superClassDoc._custom_indirect_mixed.push(selfDoc.longname);
  //  }
  //};

  let classDocs = _find({ kind: 'class' });
  for (let doc of classDocs) {
    extendsChain(doc);
    implemented(doc);
    //mixed(doc);
  }
  return docs;

  _data.__RESOLVED_EXTENDS_CHAIN__ = true;
};

/**
 * resolve ignore property.
 * https://github.com/esdoc/esdoc-plugins/blob/2de5022baa569785a189056a99acd1d7ca8284b7/esdoc-publish-html-plugin/src/Builder/DocResolver.js#L43
 * remove docs that has ignore property.
 * @private
 */
export const _resolveIgnore = (docs) => {
  if (_data.__RESOLVED_IGNORE__) return;

  const ignoreDocs = _find({ ignore: true });
  for (const doc of ignoreDocs) {
    const longname = doc.longname.replace(/[$]/g, '\\$');
    const regex = new RegExp(`^${longname}[.~#]`);
    _data({ longname: { regex: regex } }).remove();
  }
  _data({ ignore: true }).remove();

  _data.__RESOLVED_IGNORE__ = true;
  return docs;
};

/**
 * resolve undocument property.
 * https://github.com/esdoc/esdoc-plugins/blob/2de5022baa569785a189056a99acd1d7ca8284b7/esdoc-publish-html-plugin/src/Builder/DocResolver.js#L43
 * remove docs that has undocument property.
 * @private
 */
export const _resolveUndocument = (docs) => {
  if (_data.__RESOLVED_UNDOCUMENT__) return;

  const ignoreDocs = _find({ undocument: true });
  for (const doc of ignoreDocs) {
    const longname = doc.longname.replace(/[$]/g, '\\$');
    const regex = new RegExp(`^${longname}[.~#]`);
    _data({ longname: { regex: regex } }).remove();
  }
  _data({ undocument: true }).remove();

  _data.__RESOLVED_UNDOCUMENT__ = true;
  return docs;
};
/**
 * resolve @link as html link.
 * https://github.com/esdoc/esdoc-plugins/blob/2de5022baa569785a189056a99acd1d7ca8284b7/esdoc-publish-html-plugin/src/Builder/DocResolver.js#L89
 * @private
 * @todo resolve all ``description`` property.
 */
export const _resolveLink = (docs) => {
  if (_data.__RESOLVED_LINK__) return;

  const link = (str) => {
    if (!str) return str;
    return str.replace(/\{@link ([\w#_\-.:~\/$]+)}/g, (str, longname) => {
      // Code from DocLinkHTML.js
      // transform {@link } in markdown.
      const doc = _findByName(longname)[0];
      if (!doc) {
        return str;
      }
      const url = _getURL(doc, false);
      if (url) {
        return `[${longname}](/doc/${url.replace(/\./g, '%20')})`;
      }
    });
  };

  _data().each((v) => {
    v.description = link(v.description);

    if (v.params) {
      for (const param of v.params) {
        param.description = link(param.description);
      }
    }

    if (v.properties) {
      for (const property of v.properties) {
        property.description = link(property.description);
      }
    }

    if (v.return) {
      v.return.description = link(v.return.description);
    }

    if (v.throws) {
      for (const _throw of v.throws) {
        _throw.description = link(_throw.description);
      }
    }

    if (v.listens) {
      for (const _listen of v.listens) {
        _listen.description = link(_listen.description);
      }
    }

    if (v.emits) {
      for (const _emit of v.emits) {
        _emit.description = link(_emit.description);
      }
    }

    if (v.see) {
      for (let i = 0; i < v.see.length; i++) {
        if (v.see[i].indexOf('{@link') === 0) {
          v.see[i] = link(v.see[i]);
        } else if (v.see[i].indexOf('<a href') === 0) {
          // ignore
        } else {
          v.see[i] = `<a href="${v.see[i]}">${v.see[i]}</a>`;
        }
      }
    }
  });

  _data.__RESOLVED_LINK__ = true;
  return docs;
};

/**
 * resolve necessary identifier.
 * https://github.com/esdoc/esdoc-plugins/blob/2de5022baa569785a189056a99acd1d7ca8284b7/esdoc-publish-html-plugin/src/Builder/DocResolver.js#L277
 *
 * ```javascript
 * class Foo {}
 *
 * export default Bar extends Foo {}
 * ```
 *
 * ``Foo`` is not exported, but ``Bar`` extends ``Foo``.
 * ``Foo`` is necessary.
 * So, ``Foo`` must be exported by force.
 *
 * @private
 */
export const _resolveNecessary = (docs) => {
  _data({ export: false }).update(function () {
    let doc = this;
    let childNames = [];
    if (doc._custom_direct_subclasses)
      childNames.push(...doc._custom_direct_subclasses);
    if (doc._custom_indirect_subclasses)
      childNames.push(...doc._custom_indirect_subclasses);
    if (doc._custom_direct_implemented)
      childNames.push(...doc._custom_direct_implemented);
    if (doc._custom_indirect_implemented)
      childNames.push(...doc._custom_indirect_implemented);

    for (let childName of childNames) {
      let childDoc = _find({ longname: childName })[0];
      if (!childDoc) continue;
      if (!childDoc.ignore && childDoc.export) {
        doc.ignore = false;
        return doc;
      }
    }
  });
  return docs;
};

/**
 * find doc object for each access.
 * https://github.com/esdoc/esdoc-plugins/blob/2de5022baa569785a189056a99acd1d7ca8284b7/esdoc-publish-html-plugin/src/Builder/DocBuilder.js#L226
 * @param {DocObject} doc - parent doc object.
 * @param {string} kind - kind property condition.
 * @param {boolean} isStatic - static property condition
 * @returns {Array[]} found doc objects.
 * @property {Array[]} 0 - ['Public', DocObject[]]
 * @property {Array[]} 1 - ['Protected', DocObject[]]
 * @property {Array[]} 2 - ['Private', DocObject[]]
 * @private
 */
export const _findAccessDocs = (doc, kind, isStatic = true) => {
  const cond = { kind: kind, static: isStatic };

  if (doc) cond.memberof = doc.longname;

  /* eslint-disable default-case */
  switch (kind) {
    case 'class':
      cond.interface = false;
      break;
    case 'interface':
      cond.kind = 'class';
      cond.interface = true;
      break;
    case 'member':
      cond.kind = ['member', 'get', 'set'];
      break;
  }

  const publicDocs = _find(cond, { access: 'public' }).filter(
    (v) => !v.builtinExternal,
  );
  const protectedDocs = _find(cond, { access: 'protected' }).filter(
    (v) => !v.builtinExternal,
  );
  const privateDocs = _find(cond, { access: 'private' }).filter(
    (v) => !v.builtinExternal,
  );
  const accessDocs = [
    ['Public', publicDocs],
    // We don't want to display private and protected functions
    // to keep the doc simple as possible. Feel free to uncomment
    // the following line if you want them.
    // ['Protected', protectedDocs],
    // ['Private', privateDocs],
  ];

  return accessDocs;
};

/**
 * shorten description.
 * e.g. ``this is JavaScript. this is Java.`` => ``this is JavaScript.``.
 * https://github.com/esdoc/esdoc-plugins/blob/2de5022baa569785a189056a99acd1d7ca8284b7/esdoc-publish-html-plugin/src/Builder/util.js#L4
 *
 * @param {DocObject} doc - target doc object.
 * @param {boolean} [asMarkdown=false] - is true, test as markdown and convert to html.
 * @returns {string} shorten description.
 * @todo shorten before process markdown.
 */
export function shorten(doc, asMarkdown = false) {
  if (!doc) return '';

  if (doc.summary) return doc.summary;

  const desc = doc.descriptionRaw;
  if (!desc) return '';

  let len = desc.length;
  let inSQuote = false;
  let inWQuote = false;
  let inCode = false;
  for (let i = 0; i < desc.length; i++) {
    const char1 = desc.charAt(i);
    const char2 = desc.charAt(i + 1);
    const char4 = desc.substr(i, 6);
    const char5 = desc.substr(i, 7);
    if (char1 === "'") inSQuote = !inSQuote;
    else if (char1 === '"') inWQuote = !inWQuote;
    else if (char4 === '<code>') inCode = true;
    else if (char5 === '</code>') inCode = false;

    if (inSQuote || inCode || inWQuote) continue;

    if (char1 === '.') {
      if (char2 === ' ' || char2 === '\n' || char2 === '<') {
        len = i + 1;
        break;
      }
    } else if (char1 === '\n' && char2 === '\n') {
      len = i + 1;
      break;
    }
  }

  let result = desc.substr(0, len);
  // Use Markdown component instead
  // if (asMarkdown) {
  //   result = markdown(result);
  // }

  return result;
}

/**
 * parse ``@example`` value.
 * ``@example`` value can have ``<caption>`` tag.
 * https://github.com/esdoc/esdoc-plugins/blob/2de5022baa569785a189056a99acd1d7ca8284b7/esdoc-publish-html-plugin/src/Builder/util.js#L127
 *
 * @param {string} example - target example value.
 * @returns {{body: string, caption: string}} parsed example value.
 */
export function parseExample(example) {
  let body = example;
  let caption = '';

  /* eslint-disable no-control-regex */
  const regexp = new RegExp('^<caption>(.*?)</caption>\n');
  const matched = example.match(regexp);
  if (matched) {
    body = example.replace(regexp, '');
    caption = matched[1].trim();
  }

  return { body, caption };
}

/**
 * escape URL hash.
 * https://github.com/esdoc/esdoc-plugins/blob/2de5022baa569785a189056a99acd1d7ca8284b7/esdoc-publish-html-plugin/src/Builder/util.js#L149
 * @param {string} hash - URL hash for HTML a tag and id tag
 * @returns {string} escaped URL hash
 */
export const escapeURLHash = (hash) => {
  return hash
    .toLowerCase()
    .replace(/[~!@#$%^&*()_+=\[\]\\{}|;':"<>?,.\/ ]/g, '-');
};

/**
 * Create search index of identifier builder class.
 * https://github.com/esdoc/esdoc-plugins/blob/2de5022baa569785a189056a99acd1d7ca8284b7/esdoc-publish-html-plugin/src/Builder/SearchIndexBuilder.js#L7
 */
export const _getSearchIndex = () => {
  if (searchIndex) {
    return searchIndex;
  }

  searchIndex = [];
  const docs = _find({});

  for (const doc of docs) {
    if (doc.kind === 'index') continue;
    if (doc.kind.indexOf('manual') === 0) continue;

    let indexText;
    let url;
    let displayText;

    if (doc.importPath) {
      displayText = (
        <>
          <span>{doc.name}</span>{' '}
          <span class="search-result-import-path">{doc.importPath}</span>
        </>
      );
      indexText = `${doc.importPath}~${doc.name}`.toLowerCase();
      url = _getURL(doc);
    } else if (doc.kind === 'test') {
      displayText = doc.testFullDescription;
      indexText = [
        ...(doc.testTargets || []),
        ...(doc._custom_test_targets || []),
      ]
        .join(' ')
        .toLowerCase();
      const filePath = doc.longname.split('~')[0];
      const fileDoc = _find({ kind: 'testFile', name: filePath })[0];
      url = `${_getURL(fileDoc)}#lineNumber${doc.lineNumber}`;
    } else if (doc.kind === 'external') {
      displayText = doc.longname;
      indexText = displayText.toLowerCase();
      url = doc.externalLink;
    } else if (doc.kind === 'file' || doc.kind === 'testFile') {
      displayText = doc.name;
      indexText = displayText.toLowerCase();
      url = _getURL(doc);
    } else if (doc.kind === 'packageJSON') {
      continue;
    } else {
      displayText = doc.longname;
      indexText = displayText.toLowerCase();
      url = _getURL(doc);
    }

    let kind = doc.kind;
    /* eslint-disable default-case */
    switch (kind) {
      case 'constructor':
        kind = 'method';
        break;
      case 'get':
      case 'set':
        kind = 'member';
        break;
    }

    searchIndex.push([indexText, url, displayText, kind]);
  }

  searchIndex.sort((a, b) => {
    if (a[2] === b[2]) {
      return 0;
    } else if (a[2] < b[2]) {
      return -1;
    } else {
      return 1;
    }
  });
  return searchIndex;
};
