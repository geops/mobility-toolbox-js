/* eslint-disable no-continue */
/* eslint-disable no-restricted-syntax */
/* eslint-disable react/no-array-index-key */
/* eslint-disable no-underscore-dangle */
import React from 'react';
import InheritedSummaryDoc from './InheritedSummaryDoc';
import { _find } from './DocBuilderUtils';

/**
 * build inherited method/member summary.
 * https://github.com/esdoc/esdoc-plugins/blob/2de5022baa569785a189056a99acd1d7ca8284b7/esdoc-publish-html-plugin/src/Builder/ClassDocBuilder.js#L220
 * @param {DocObject} doc - target class doc.
 * @returns {string} html of inherited method/member from ancestor classes.
 * @private
 */
const InheritedSummaryHTML = ({ doc }) => {
  if (['class', 'interface'].indexOf(doc.kind) === -1) return '';

  const longnames = [
    ...(doc._custom_extends_chains || []),
    // ...doc.implements || [],
    // ...doc._custom_indirect_implements || [],
  ];

  return longnames.map((longname, idx) => {
    const superDoc = _find({ longname })[0];

    if (!superDoc) return null;

    return (
      <React.Fragment key={idx}>
        <InheritedSummaryDoc longname={longname} />
        {idx !== longnames.length - 1 ? '\n' : ''}
      </React.Fragment>
    );
  });
};
export default React.memo(InheritedSummaryHTML);
