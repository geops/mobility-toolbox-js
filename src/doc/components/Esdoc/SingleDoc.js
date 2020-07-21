/* eslint-disable no-continue */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-underscore-dangle */
/* eslint-disable react/prop-types */
import React from 'react';
import SummaryHTML from './SummaryHTML';
import DetailHTML from './DetailHTML';

/**
 * build single output.
 * https://github.com/esdoc/esdoc-plugins/blob/2de5022baa569785a189056a99acd1d7ca8284b7/esdoc-publish-html-plugin/src/Builder/SingleDocBuilder.js#L29
 * @param {string} kind - target kind property.
 * @returns {string} html of single output
 * @private
 */
const SingleDoc = ({ kind }) => {
  const title = kind.replace(/^(\w)/, (c) => c.toUpperCase());
  return (
    <>
      <h1 data-ice="title">{title}</h1>
      <div data-ice="summaries">
        <SummaryHTML doc={null} kind={kind} title="Summary" />
      </div>
      <div data-ice="details">
        <DetailHTML doc={null} kind={kind} title="" />
      </div>
    </>
  );
};

export default React.memo(SingleDoc);
