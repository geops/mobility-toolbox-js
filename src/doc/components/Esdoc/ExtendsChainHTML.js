/* eslint-disable react/prop-types */
/* eslint-disable no-underscore-dangle */
import React from 'react';
import DocLinkHTML from './DocLinkHTML';

/**
 * build class ancestor extends chain.
 * https://github.com/esdoc/esdoc-plugins/blob/2de5022baa569785a189056a99acd1d7ca8284b7/esdoc-publish-html-plugin/src/Builder/ClassDocBuilder.js#L172
 * @param {DocObject} doc - target class doc.
 * @returns {string} extends chain links html.
 * @private
 */
const ExtendsChainHTML = ({ doc }) => {
  if (!doc._custom_extends_chains) return '';
  if (doc.extends.length > 1) return '';

  return (
    <div className="flat-list" data-ice="extendsChain">
      <h4>Extends:</h4>
      <div>
        {doc._custom_extends_chains.map((extend) => (
          <React.Fragment key={extend}>
            <DocLinkHTML longname={extend} />
            {' → '}
          </React.Fragment>
        ))}
        {doc.name}
      </div>
    </div>
  );
};
export default React.memo(ExtendsChainHTML);
