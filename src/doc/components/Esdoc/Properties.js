/* eslint-disable react/no-array-index-key */
/* eslint-disable react/prop-types */
import React from 'react';
import Markdown from 'react-markdown';
import TypeDocLinkHTML from './TypeDocLinkHTML';

/**
 * build properties output.
 * https://github.com/esdoc/esdoc-plugins/blob/2de5022baa569785a189056a99acd1d7ca8284b7/esdoc-publish-html-plugin/src/Builder/DocBuilder.js#L870
 * @param {ParsedParam[]} [properties=[]] - properties in doc object.
 * @param {string} title - output title.
 * @return {IceCap} built properties output.
 * @private
 */
const Properties = ({ properties = [], title = 'Properties:' }) => {
  return (
    <div data-ice="properties">
      <h4 data-ice="title">{title}</h4>
      <table className="params">
        <thead>
          <tr>
            <td>Name</td>
            <td>Type</td>
            <td>Attribute</td>
            <td>Description</td>
          </tr>
        </thead>
        <tbody>
          {properties.map((prop) => {
            // appendix
            const appendix = [];
            if (prop.optional) {
              appendix.push(<li>optional</li>);
            }
            if ('defaultValue' in prop) {
              appendix.push(<li>default: {prop.defaultValue}</li>);
            }
            if (typeof prop.nullable === 'boolean') {
              appendix.push(<li>nullable: {prop.nullable}</li>);
            }
            return (
              <tr
                key={prop.name}
                data-ice="property"
                data-depth={prop.name.split('.').length - 1}
              >
                <td
                  data-ice="name"
                  className="code"
                  data-depth={prop.name.split('.').length - 1}
                >
                  {prop.name}
                </td>
                <td data-ice="type" className="code">
                  {prop.types.map((typeName, idx) => {
                    return (
                      <React.Fragment key={idx}>
                        <TypeDocLinkHTML typeName={typeName} />
                        {idx !== prop.types.length - 1 ? ' | ' : ''}
                      </React.Fragment>
                    );
                  })}
                </td>
                <td data-ice="appendix">
                  {!!appendix.length && (
                    <ul>
                      {appendix.map((comp, idx) => {
                        return (
                          <React.Fragment key={idx}>
                            {comp}
                            {idx !== appendix.length - 1 ? '\n' : ''}
                          </React.Fragment>
                        );
                      })}
                    </ul>
                  )}
                </td>
                <td data-ice="description">
                  <Markdown source={prop.description} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
export default React.memo(Properties);
