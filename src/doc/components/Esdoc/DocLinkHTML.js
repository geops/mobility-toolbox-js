/* eslint-disable no-param-reassign */
/* eslint-disable react/prop-types */
/* eslint-disable react/no-danger */
import React from 'react';

import { _findByName, _getURL } from './DocBuilderUtils';

const DocLinkHTML = ({ longname, text = null, inner = false, kind = null }) => {
  if (!longname) return '';

  if (typeof longname !== 'string') throw new Error(JSON.stringify(longname));

  const doc = _findByName(longname, kind)[0];

  if (!doc) {
    // if longname is HTML tag, not escape.
    if (longname.indexOf('<') === 0) {
      return <span dangerouslySetInnerHTML={{ __html: longname }} />;
    }
    return <span>{text || longname}</span>;
  }

  if (doc.kind === 'external') {
    text = doc.name;
    return (
      <span>
        <a target="_blank" rel="noreferrer" href={doc.externalLink}>
          {text}
        </a>
      </span>
    );
  }
  text = text || doc.name;
  const url = _getURL(doc, inner);
  if (url) {
    return (
      <span>
        <a href={`/api/${url.replace(/\./g, '%20')}`}>{text}</a>
      </span>
    );
  }
  return <span>{text}</span>;
};
export default React.memo(DocLinkHTML);
