/* eslint-disable no-param-reassign */
/* eslint-disable prefer-destructuring */
/* eslint-disable react/prop-types */
import React from 'react';

import { _find, _getURL } from './DocBuilderUtils';

/**
 * build html link to file page.
 * https://github.com/esdoc/esdoc-plugins/blob/2de5022baa569785a189056a99acd1d7ca8284b7/esdoc-publish-html-plugin/src/Builder/DocBuilder.js#L592
 * @param {DocObject} doc - target doc object.
 * @param {string} text - link text.
 * @returns {string} html of link.
 * @private
 */
function FileDocLinkHTML({ doc, text }) {
  if (!doc) return null;

  if (text === 'source' && doc.memberof) {
    return (
      <span>
        <a
          target="_blank"
          rel="noreferrer"
          href={`https://github.com/geops/mobility-toolbox-js/blob/master/${doc.memberof
            .split('~')[0]
            .replace('.js', '.ts')
            .replace('build/', 'src/')}#L${doc.lineNumber}`}
        >
          {text}
        </a>
      </span>
    );
  }

  let fileDoc;
  if (doc.kind === 'file' || doc.kind === 'testFile') {
    fileDoc = doc;
  } else {
    const filePath = doc.longname.split('~')[0];
    fileDoc = _find({ kind: ['file', 'testFile'], name: filePath })[0];
  }

  if (!fileDoc) return '';

  if (!text) text = fileDoc.name;

  if (doc.kind === 'file' || doc.kind === 'testFile') {
    return (
      <span>
        <a href={`${_getURL(fileDoc)}`}>{text}</a>
      </span>
    );
  }
  return (
    <span>
      <a href={`${_getURL(fileDoc)}#lineNumber${doc.lineNumber}`}>{text}</a>
    </span>
  );
}
export default React.memo(FileDocLinkHTML);
