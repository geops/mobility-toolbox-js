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
function ExtendsChainHTML({ doc }) {
  if (!doc._custom_extends_chains) return '';
  if (doc.extends.length > 1) return '';

  // We display only externals classes from outside the project.
  // TODO ideally we would like to display only what is in the @extends param.
  const extendsChains = doc._custom_extends_chains.filter((extend) =>
    extend.includes('externals'),
  );

  if (extendsChains.length === 0) return null;

  return (
    <div className="flat-list" data-ice="extendsChain">
      <h4>Extends:</h4>
      <div>
        {extendsChains.map((extend) => {
          console.log('extend', extend);
          return (
            <React.Fragment key={extend}>
              <DocLinkHTML longname={extend} />
              {/* {' → '} */}
            </React.Fragment>
          );
        })}
        {/* {doc.name} */}
      </div>
    </div>
  );
}
export default React.memo(ExtendsChainHTML);
