/* eslint-disable react/no-array-index-key */
/* eslint-disable no-continue */
/* eslint-disable no-restricted-syntax */
import React from 'react';
import TypeDocLinkHTML from './TypeDocLinkHTML';

/**
 * build identifier signature html.
 * https://github.com/esdoc/esdoc-plugins/blob/2de5022baa569785a189056a99acd1d7ca8284b7/esdoc-publish-html-plugin/src/Builder/DocBuilder.js#L813
 * @param {DocObject} doc - target doc object.
 * @returns {string} signature html.
 * @private
 */
const SignatureHTML = ({ doc }) => {
  // call signature
  const callSignatures = [];
  if (doc.params) {
    for (const param of doc.params) {
      const paramName = param.name;
      if (paramName.indexOf('.') !== -1) continue; // for object property
      if (paramName.indexOf('[') !== -1) continue; // for array property

      const types = [];
      for (const typeName of param.types) {
        types.push(<TypeDocLinkHTML typeName={typeName} />);
      }

      callSignatures.push(
        <>
          {`${paramName}: `}
          {types.map((comp, idx) => {
            return (
              <React.Fragment key={idx}>
                {comp}
                {idx !== types.length - 1 ? ' | ' : ''}
              </React.Fragment>
            );
          })}
        </>,
      );
    }
  }

  // return signature
  const returnSignatures = [];
  if (doc.return) {
    for (const typeName of doc.return.types) {
      returnSignatures.push(<TypeDocLinkHTML typeName={typeName} />);
    }
  }

  // type signature
  let typeSignatures = [];
  if (doc.type) {
    for (const typeName of doc.type.types) {
      typeSignatures.push(<TypeDocLinkHTML typeName={typeName} />);
    }
  }

  // callback is not need type. because type is always function.
  if (doc.kind === 'function') {
    typeSignatures = [];
  }

  let html = '';
  if (callSignatures.length) {
    html = (
      <>
        {`(`}
        {callSignatures.map((comp, idx) => {
          return (
            <React.Fragment key={idx}>
              {comp}
              {idx !== callSignatures.length - 1 ? ', ' : ''}
            </React.Fragment>
          );
        })}
        {`)`}
      </>
    );
  } else if (['function', 'method', 'constructor'].includes(doc.kind)) {
    html = '()';
  }
  if (returnSignatures.length)
    html = (
      <>
        {html}
        {`: `}
        {returnSignatures.map((comp, idx) => {
          return (
            <React.Fragment key={idx}>
              {comp}
              {idx !== returnSignatures.length - 1 ? ' | ' : ''}
            </React.Fragment>
          );
        })}
      </>
    );
  if (typeSignatures.length)
    html = (
      <>
        {html}
        {`: `}
        {typeSignatures.map((comp, idx) => {
          return (
            <React.Fragment key={idx}>
              {comp}
              {idx !== typeSignatures.length - 1 ? ' | ' : ''}
            </React.Fragment>
          );
        })}
      </>
    );

  return html;
};

export default React.memo(SignatureHTML);
