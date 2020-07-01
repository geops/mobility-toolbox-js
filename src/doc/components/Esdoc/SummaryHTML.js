/* eslint-disable react/prop-types */
/* eslint-disable react/no-array-index-key */
/* eslint-disable no-underscore-dangle */
import React from 'react';
import { _findAccessDocs } from './DocBuilderUtils';
import SummaryDoc from './SummaryDoc';

/**
 * build inherited method/member summary.
 * https://github.com/esdoc/esdoc-plugins/blob/2de5022baa569785a189056a99acd1d7ca8284b7/esdoc-publish-html-plugin/src/Builder/ClassDocBuilder.js#L220
 * @param {DocObject} doc - target class doc.
 * @returns {string} html of inherited method/member from ancestor classes.
 * @private
 */
const SummaryHTML = ({ doc, kind, title, isStatic = true }) => {
  const accessDocs = _findAccessDocs(doc, kind, isStatic);
  return (
    <>
      {accessDocs.map((accessDoc, idx) => {
        const docs = accessDoc[1];
        if (!docs.length) return null;

        let prefix = '';
        if (docs[0].static) prefix = 'Static ';
        const _title = `${prefix}${accessDoc[0]} ${title}`;
        return <SummaryDoc key={idx} docs={docs} title={_title} />;
      })}
    </>
  );
};
export default SummaryHTML;
