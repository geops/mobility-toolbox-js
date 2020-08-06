/* eslint-disable no-continue */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-underscore-dangle */
/* eslint-disable react/prop-types */
import React from 'react';
import path from 'path';
import SummaryDoc from './SummaryDoc';
import { escapeURLHash } from './DocBuilderUtils';

/**
 * build identifier output.
 * https://github.com/esdoc/esdoc-plugins/blob/2de5022baa569785a189056a99acd1d7ca8284b7/esdoc-publish-html-plugin/src/Builder/IdentifiersDocBuilder.js#L18
 * @return {IceCap} built output.
 * @private
 */
const IdentifiersDoc = ({ docs }) => {
  // traverse docs and create Map<dirPath, doc[]>
  const dirDocs = new Map();
  const kinds = ['class', 'interface', 'function', 'variable'];
  //   'typedef',
  //   'external',
  // ];
  const filteredDocs = docs.filter((doc) => {
    return kinds.includes(doc.kind) && !doc.ignore && doc.access === 'public';
  });

  // Add a typedef doc to have a link to main type def page
  filteredDocs.push({
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

  for (const doc of filteredDocs) {
    const filePath = doc.memberof.replace(/^.*?[/]/, '');
    const dirPath = path.dirname(filePath);
    if (!dirDocs.has(dirPath)) dirDocs.set(dirPath, []);
    dirDocs.get(dirPath).push(doc);
  }

  // create a summary of dir
  const dirPaths = Array.from(dirDocs.keys()).sort((a, b) => (a > b ? 1 : -1));
  const kindOrder = {
    class: 0,
    interface: 1,
    function: 2,
    variable: 3,
    typedef: 4,
    external: 5,
  };

  return (
    <>
      <h1>References</h1>

      <div className="identifiers-wrap">
        {dirPaths.map((dirPath) => {
          const newDirDocs = dirDocs.get(dirPath);

          // see: DocBuilder#_buildNavDoc
          newDirDocs.sort((a, b) => {
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

          const dirPathLabel = dirPath === '.' ? '' : dirPath;
          return (
            <div key={dirPathLabel} data-ice="dirSummaryWrap">
              <h2 data-ice="dirPath" id={escapeURLHash(dirPath)}>
                {dirPathLabel || 'api/'}
              </h2>
              <div data-ice="dirSummary">
                <SummaryDoc
                  docs={newDirDocs}
                  title="summary"
                  innerLink={false}
                  kindIcon
                />
              </div>
            </div>
          );
        })}
        {/* TODO
        <div className="identifier-dir-tree" data-ice="dirTreeWrap">
          <div className="identifier-dir-tree-header">Directories</div>
          <div className="identifier-dir-tree-content" data-ice="dirTree" />
        </div> */}
      </div>
    </>
  );
};

export default React.memo(IdentifiersDoc);
