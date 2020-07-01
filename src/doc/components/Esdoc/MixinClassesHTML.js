/* eslint-disable react/prop-types */
import React from 'react';
import DocLinkHTML from './DocLinkHTML';

/**
 * build mixin extends html.
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
