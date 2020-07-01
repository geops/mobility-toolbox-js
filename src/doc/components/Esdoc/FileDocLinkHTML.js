/* eslint-disable no-param-reassign */
/* eslint-disable prefer-destructuring */
/* eslint-disable react/prop-types */
import React from 'react';

import { _find, _getURL } from './DocBuilderUtils';

const FileDocLinkHTML = ({ doc, text }) => {
  if (!doc) return null;

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
};
export default React.memo(FileDocLinkHTML);
