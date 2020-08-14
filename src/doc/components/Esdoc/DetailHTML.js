/* eslint-disable no-continue */
/* eslint-disable no-restricted-syntax */
/* eslint-disable react/no-array-index-key */
/* eslint-disable no-underscore-dangle */
import React from 'react';
import { _findAccessDocs } from './DocBuilderUtils';
import DetailDocs from './DetailDocs';

/**
 * build detail output html by parent doc.
 * https://github.com/esdoc/esdoc-plugins/blob/2de5022baa569785a189056a99acd1d7ca8284b7/esdoc-publish-html-plugin/src/Builder/DocBuilder.js#L345
 * @param {DocObject} doc - parent doc object.
 * @param {string} kind - target kind property.
 * @param {string} title - detail title.
 * @param {boolean} [isStatic=true] - target static property.
 * @returns {string} html of detail.
 * @private
 */
const DetailHTML = ({ doc, kind, title, isStatic = true }) => {
  const accessDocs = _findAccessDocs(doc, kind, isStatic);
  return accessDocs.map((accessDoc, idx) => {
    const docs = accessDoc[1];
    if (!docs.length) return null;

    let prefix = '';
    if (docs[0].static) prefix = 'Static ';
    const _title = `${prefix}${
      accessDoc[0] === 'Public' ? '' : `${accessDoc[0]} `
    }${title}`;
    return <DetailDocs key={idx} docs={docs} title={_title} />;
  });
};
export default React.memo(DetailHTML);
