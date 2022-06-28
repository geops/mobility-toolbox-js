/* eslint-disable no-param-reassign */
/* eslint-disable react/prop-types */
/* eslint-disable react/no-danger */
import React from 'react';
import Anchor from './Anchor';
import { _findByName, _getURL } from './DocBuilderUtils';

/**
 * build html link to file page.
 * https://github.com/esdoc/esdoc-plugins/blob/2de5022baa569785a189056a99acd1d7ca8284b7/esdoc-publish-html-plugin/src/Builder/DocBuilder.js#L592
 * @param {DocObject} doc - target doc object.
 * @param {string} text - link text.
 * @returns {string} html of link.
 * @private
 */
function DocLinkHTML({ longname, text = null, inner = false, kind = null }) {
  if (!longname) return '';

  if (typeof longname !== 'string') throw new Error(JSON.stringify(longname));

  const doc = _findByName(longname, kind)[0];

  if (!doc) {
    // Special links to typedefs main page
    if (longname === 'typedefs') {
      return (
        <span>
          <a href="/doc/typedef/index%20html">{text || longname}</a>
        </span>
      );
    }
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
        <Anchor path={`/doc/${url.replace(/\./g, '%20')}-offset-anchor`}>
          {text}
        </Anchor>
      </span>
    );
  }
  return <span>{text}</span>;
}
export default React.memo(DocLinkHTML);
