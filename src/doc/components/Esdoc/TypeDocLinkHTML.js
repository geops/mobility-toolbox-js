/* eslint-disable prefer-destructuring */
/* eslint-disable no-shadow */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-param-reassign */
/* eslint-disable react/prop-types */
/* eslint-disable react/no-array-index-key */
import React from 'react';
import DocLinkHTML from './DocLinkHTML';

/**
 * build html link of type.
 * https://github.com/esdoc/esdoc-plugins/blob/2de5022baa569785a189056a99acd1d7ca8284b7/esdoc-publish-html-plugin/src/Builder/DocBuilder.js#L621
 * @param {string} typeName - type name(e.g. ``number[]``, ``Map<number, string>``)
 * @returns {string} html of link.
 * @private
 * @todo re-implement with parser combinator.
 */
function TypeDocLinkHTML({ typeName }) {
  // e.g. number[]
  let matched = typeName.match(/^(.*?)\[\]$/);
  if (matched) {
    typeName = matched[1];
    return (
      <span>
        <DocLinkHTML longname={typeName} text={typeName} />
        <span>[]</span>
      </span>
    );
  }

  // e.g. function(a: number, b: string): boolean
  matched = typeName.match(/function *\((.*?)\)(.*)/);
  if (matched) {
    const functionLink = <DocLinkHTML longname="function" />;
    if (!matched[1] && !matched[2])
      return (
        <span>
          {functionLink}
          <span>()</span>
        </span>
      );

    let innerTypes = [];
    if (matched[1]) {
      // bad hack: Map.<string, boolean> => Map.<string\Z boolean>
      // bad hack: {a: string, b: boolean} => {a\Y string\Z b\Y boolean}
      const inner = matched[1]
        .replace(/<.*?>/g, (a) => a.replace(/,/g, '\\Z'))
        .replace(/{.*?}/g, (a) => a.replace(/,/g, '\\Z').replace(/:/g, '\\Y'));
      innerTypes = inner.split(',').map((v) => {
        const tmp = v.split(':').map((v) => v.trim());
        if (tmp.length !== 2)
          throw new SyntaxError(
            `Invalid function type annotation: \`${matched[0]}\``,
          );

        const paramName = tmp[0];
        const typeName = tmp[1].replace(/\\Z/g, ',').replace(/\\Y/g, ':');
        return (
          <>
            {paramName}: <TypeDocLinkHTML typeName={typeName} />
          </>
        );
      });
    }

    let returnType = '';
    if (matched[2]) {
      const type = matched[2].split(':')[1];

      if (type)
        returnType = (
          <>
            : <TypeDocLinkHTML typeName={type.trim()} />
          </>
        );
    }

    return (
      <span>
        {functionLink}
        <span>
          (
          {innerTypes.map((comp, idx) => {
            return (
              <React.Fragment key={idx}>
                {comp}
                {idx !== innerTypes.length - 1 ? ', ' : ''}
              </React.Fragment>
            );
          })}
          )
        </span>
        {returnType}
      </span>
    );
  }

  // e.g. {a: number, b: string}
  matched = typeName.match(/^\{(.*?)\}$/);
  if (matched) {
    if (!matched[1]) return '{}';

    // bad hack: Map.<string, boolean> => Map.<string\Z boolean>
    // bad hack: {a: string, b: boolean} => {a\Y string\Z b\Y boolean}
    const inner = matched[1]
      .replace(/<.*?>/g, (a) => a.replace(/,/g, '\\Z'))
      .replace(/{.*?}/g, (a) => a.replace(/,/g, '\\Z').replace(/:/g, '\\Y'));

    let broken = false;

    const innerTypes = inner.split(',').map((v) => {
      const tmp = v.split(':').map((v) => v.trim());

      // edge case: if object key includes comma, this parsing is broken.
      // e.g. {"a,b": 10}
      // https://github.com/esdoc/esdoc-plugins/pull/49
      if (!tmp[0] || !tmp[1]) {
        broken = true;
        return null;
      }

      const paramName = tmp[0];
      let typeName = tmp[1].replace(/\\Z/g, ',').replace(/\\Y/g, ':');
      if (typeName.includes('|')) {
        typeName = typeName.replace(/^\(/, '').replace(/\)$/, '');
        const typeNames = typeName.split('|').map((v) => v.trim());
        const html = [];
        for (const unionType of typeNames) {
          html.push(<TypeDocLinkHTML typeName={unionType} />);
        }
        return (
          <>
            {paramName}:{' '}
            {html.map((comp, idx) => {
              return (
                <React.Fragment key={idx}>
                  {comp}
                  {idx !== html.length - 1 ? '|' : ''}
                </React.Fragment>
              );
            })}
          </>
        );
      }
      return (
        <>
          {paramName}: <TypeDocLinkHTML typeName={typeName} />
        </>
      );
    });

    if (broken) return `*`;

    return (
      <>
        {`{`}
        {innerTypes.map((comp, idx) => {
          return (
            <React.Fragment key={idx}>
              {comp}
              {idx !== innerTypes.length - 1 ? ', ' : ''}
            </React.Fragment>
          );
        })}
        {`}`}
      </>
    );
  }

  // e.g. Map<number, string>
  matched = typeName.match(/^(.*?)\.?<(.*?)>$/);
  if (matched) {
    const mainType = matched[1];
    // bad hack: Map.<string, boolean> => Map.<string\Z boolean>
    // bad hack: {a: string, b: boolean} => {a\Y string\Z b\Y boolean}
    const inner = matched[2]
      .replace(/<.*?>/g, (a) => a.replace(/,/g, '\\Z'))
      .replace(/{.*?}/g, (a) => a.replace(/,/g, '\\Z').replace(/:/g, '\\Y'));
    const innerTypes = inner.split(',').map((v) => {
      return v.split('|').map((vv, idx) => {
        vv = vv.trim().replace(/\\Z/g, ',').replace(/\\Y/g, ':');
        return (
          <React.Fragment key={idx}>
            <TypeDocLinkHTML typeName={vv} />
            {idx !== v.split('|').length - 1 ? '|' : ''}
          </React.Fragment>
        );
      });
    });

    const html = (
      <>
        <DocLinkHTML longname={mainType} text={mainType} />
        {`<`}
        {innerTypes.map((comp, idx) => {
          return (
            <React.Fragment key={idx}>
              {comp}
              {idx !== innerTypes.length - 1 ? ', ' : ''}
            </React.Fragment>
          );
        })}
        {`>`}
      </>
    );
    return html;
  }

  if (typeName.indexOf('...') === 0) {
    typeName = typeName.replace('...', '');
    if (typeName.includes('|')) {
      const typeNames = typeName.replace('(', '').replace(')', '').split('|');
      const typeLinks = typeNames.map((v) => <DocLinkHTML longname={v} />);
      return (
        <>
          ...(
          {typeLinks.map((comp, idx) => {
            return (
              <React.Fragment key={idx}>
                {comp}
                {idx !== typeLinks.length - 1 ? '|' : ''}
              </React.Fragment>
            );
          })}
          )
        </>
      );
    }
    return (
      <>
        ...
        <DocLinkHTML longname={typeName} />
      </>
    );
  }
  if (typeName.indexOf('?') === 0) {
    typeName = typeName.replace('?', '');
    return (
      <>
        ?
        <DocLinkHTML longname={typeName} />
      </>
    );
  }
  return <DocLinkHTML longname={typeName} />;
}

export default React.memo(TypeDocLinkHTML);
