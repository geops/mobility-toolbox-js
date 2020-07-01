/* eslint-disable react/prop-types */
import React from 'react';
import DocLinkHTML from './DocLinkHTML';
/**
 * build html links to identifiers
 * https://github.com/esdoc/esdoc-plugins/blob/2de5022baa569785a189056a99acd1d7ca8284b7/esdoc-publish-html-plugin/src/Builder/DocBuilder.js#L788
 * @param {string[]} longnames - link to these.
 * @param {string} [text] - link text. default is name property of doc object.
 * @param {boolean} [inner=false] - if true, use inner link.
 * @param {string} [separator='\n'] - used link separator.
 * @returns {string} html links.
 * @private
 */
const DocsLinkHTML = ({
  longnames,
  text = null,
  inner = false,
  separator = '\n',
}) => {
  if (!longnames) return '';
  if (!longnames.length) return '';

  const nonNullLongNames = longnames.filter((longname) => !!longname);
  if (!nonNullLongNames.length) return '';

  return (
    <ul>
      {nonNullLongNames.map((longname, idx) => (
        <li key={longname}>
          <DocLinkHTML longname={longname} text={text} inner={inner} />
          {idx !== longnames.length - 1 ? `${separator}` : ''}
        </li>
      ))}
    </ul>
  );
};
export default React.memo(DocsLinkHTML);
