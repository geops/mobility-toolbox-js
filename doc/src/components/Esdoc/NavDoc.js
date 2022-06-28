/* eslint-disable no-continue */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-underscore-dangle */
/* eslint-disable react/prop-types */
import React from 'react';
import path from 'path';
import Anchor from './Anchor';
import { _find, escapeURLHash } from './DocBuilderUtils';
import DocLinkHTML from './DocLinkHTML';

/**
 * build common navigation output.
 * https://github.com/esdoc/esdoc-plugins/blob/2de5022baa569785a189056a99acd1d7ca8284b7/esdoc-publish-html-plugin/src/Builder/DocBuilder.js#L177
 * @return {IceCap} navigation output.
 * @private
 */
function NavDoc() {
  const kinds = ['class', 'function', 'variable']; // , 'typedef', 'external'];

  // we display only public doc and not externals, feel free to reactivate them if you want.
  const allDocs = _find({ kind: kinds }).filter((v) => v.access === 'public');

  const kindOrder = {
    class: 0,
    interface: 1,
    function: 2,
    variable: 3,
    typedef: 4,
    external: 5,
  };

  // Add a typedef doc to have a link to main type def page
  allDocs.push({
    access: 'public',
    description: null,
    export: false,
    importPath: 'mobility-toolbox-js/src/index.js',
    importStyle: 'typedef',
    kind: 'typedef',
    lineNumber: 1,
    longname: 'typedefs',
    memberof: 'src/index.js',
    name: 'typedefs',
    static: true,
    undocument: true,
  });

  // see: IdentifiersDocBuilder#_buildIdentifierDoc
  allDocs.sort((a, b) => {
    const filePathA = a.longname.split('~')[0];
    const filePathB = b.longname.split('~')[0];
    const dirPathA = path.dirname(filePathA);
    const dirPathB = path.dirname(filePathB);
    const kindA = a.interface ? 'interface' : a.kind;
    const kindB = b.interface ? 'interface' : b.kind;
    if (dirPathA === dirPathB) {
      if (kindA === kindB) {
        return a.longname > b.longname ? 1 : -1;
      }
      return kindOrder[kindA] > kindOrder[kindB] ? 1 : -1;
    }
    return dirPathA > dirPathB ? 1 : -1;
  });
  let lastDirPath = '.';

  return (
    <div>
      <ul>
        {allDocs.map((doc) => {
          const filePath = doc.longname.split('~')[0].replace(/^.*?[/]/, '');
          const dirPath = path.dirname(filePath);
          const kind = doc.interface ? 'interface' : doc.kind;
          const kindText = kind.charAt(0).toUpperCase();
          const kindClass = `kind-${kind}`;
          //   ice.load('name', this._buildDocLinkHTML(doc.longname));
          //   ice.load('kind', kindText);
          //   ice.attr('kind', 'class', kindClass);
          //   ice.text('dirPath', dirPath);
          //   ice.attr(
          //     'dirPath',
          //     'href',
          //     `identifiers.html#${escapeURLHash(dirPath)}`,
          //   );
          //   ice.drop('dirPath', lastDirPath === dirPath);
          const displayDir = lastDirPath !== dirPath;
          lastDirPath = dirPath;
          return (
            <li data-ice="doc" key={doc.longname}>
              {displayDir && (
                <Anchor
                  data-ice="dirPath"
                  className="nav-dir-path"
                  path={`/doc/identifiers%20html#${escapeURLHash(dirPath)}`}
                >
                  {dirPath || 'api'}
                </Anchor>
              )}
              <span data-ice="kind" className={kindClass}>
                {kindText}
              </span>
              <span data-ice="name">
                <DocLinkHTML longname={doc.longname} />
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default React.memo(NavDoc);
