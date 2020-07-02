/* eslint-disable react/prop-types */
/* eslint-disable no-underscore-dangle */
import React from 'react';
import DocLinkHTML from './DocLinkHTML';

/**
 * build in-direct subclass list.
 * https://github.com/esdoc/esdoc-plugins/blob/2de5022baa569785a189056a99acd1d7ca8284b7/esdoc-publish-html-plugin/src/Builder/ClassDocBuilder.js#L186
 * @param {DocObject} doc - target class doc.
 * @returns {string} html of in-direct subclass links.
 * @private
 */
const IndirectSubclassHTML = ({ doc }) => {
  if (!doc._custom_indirect_subclasses) return '';

  return (
    <div className="flat-list" data-ice="directSubclass">
      <h4>Direct Subclass:</h4>
      <div>
        {doc._custom_indirect_subclasses.map((extend, idx) => (
          <React.Fragment key={extend}>
            <DocLinkHTML longname={extend} />
            {idx !== doc._custom_indirect_subclasses.length - 1 ? ', ' : ''}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
export default React.memo(IndirectSubclassHTML);
