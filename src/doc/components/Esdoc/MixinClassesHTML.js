/* eslint-disable react/prop-types */
import React from 'react';
import DocLinkHTML from './DocLinkHTML';

/**
 * build mixin extends html.
 * https://github.com/esdoc/esdoc-plugins/blob/2de5022baa569785a189056a99acd1d7ca8284b7/esdoc-publish-html-plugin/src/Builder/ClassDocBuilder.js#L134
 * @param {DocObject} doc - target class doc.
 * @return {string} mixin extends html.
 */
const MixinClassesHTML = ({ doc }) => {
  if (!doc.extends) return '';
  if (doc.extends.length <= 1) return '';

  return (
    <div className="flat-list" data-ice="mixinExtends">
      <h4>Mixin Extends:</h4>
      <div>
        {doc.extends.map((extend, idx) => (
          <React.Fragment key={extend}>
            <DocLinkHTML longname={extend} />{' '}
            {idx !== doc.extends.length - 1 ? ', ' : ''}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
export default React.memo(MixinClassesHTML);
