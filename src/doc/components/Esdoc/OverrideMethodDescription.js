/* eslint-disable no-continue */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-underscore-dangle */
import React from 'react';
import { _findByName, _find } from './DocBuilderUtils';
/**
 * build method of ancestor class description.
 * https://github.com/esdoc/esdoc-plugins/blob/2de5022baa569785a189056a99acd1d7ca8284b7/esdoc-publish-html-plugin/src/Builder/DocBuilder.js#L977
 * @param {DocObject} doc - target doc object.
 * @returns {string} description. if doc does not override ancestor method, returns empty.
 * @private
 */
const OverrideMethodDescription = ({ doc }) => {
  const parentDoc = _findByName(doc.memberof)[0];
  if (!parentDoc) return '';
  if (!parentDoc._custom_extends_chains) return '';

  const chains = [...parentDoc._custom_extends_chains].reverse();
  for (const longname of chains) {
    const superClassDoc = _findByName(longname)[0];
    if (!superClassDoc) continue;

    const superMethodDoc = _find({
      name: doc.name,
      memberof: superClassDoc.longname,
    })[0];
    if (!superMethodDoc) continue;

    if (superMethodDoc.description) return superMethodDoc.description;
  }

  return '';
};

export default React.memo(OverrideMethodDescription);
