/* eslint-disable react/prop-types */
/* eslint-disable react/no-array-index-key */
import React from 'react';
import Markdown from 'react-markdown';
import DocLinkHTML from './DocLinkHTML';
import SignatureHTML from './SignatureHTML';
import ExperimentalHTML from './ExperimentalHTML';
import DeprecatedHTML from './DeprecatedHTML';

const showInheritedHref = (memberof, parentMemberOf) => {
  const name = memberof.split('~');
  if (name[0] === parentMemberOf) {
    return null;
  }
  return (
    <>
      Inherited from:{' '}
      <a href={`/api/class/${memberof.replace('.', '%20')}%20html`}>
        {name.length && name[1]}
      </a>
    </>
  );
};
/**
 * build summary output html by docs.
 * https://github.com/esdoc/esdoc-plugins/blob/2de5022baa569785a189056a99acd1d7ca8284b7/esdoc-publish-html-plugin/src/Builder/DocBuilder.js#L294
 * @param {DocObject[]} docs - target docs.
 * @param {string} title - summary title.
 * @param {boolean} innerLink - if true, link in summary is inner link.
 * @param {boolean} kindIcon - use kind icon.
 * @param {string} memberof - memberof of the parent doc.
 * @return {IceCap} summary output.
 * @protected
 */
const SummaryDoc = ({
  docs,
  title,
  innerLink = false,
  kindIcon = false,
  memberof,
  style,
}) => {
  if (docs.length === 0) return null;

  return (
    <table className="summary" data-ice="summary">
      <thead>
        <tr>
          <td data-ice="title" colSpan="2">
            {title}
          </td>
        </tr>
      </thead>
      <tbody style={style}>
        {docs.map((doc, idx) => {
          const kindKindIcon = doc.interface ? 'interface' : doc.kind;
          return (
            <tr data-ice="target" key={idx}>
              {/* Hide the access (public) column */}
              {/*
              <td>
                <span className="access" data-ice="access">
                  {doc.access}
                </span>
                {staticc && <span data-ice="static">{staticc}</span>}
                {kind && (
                  <span className="kind" data-ice="kind">
                    {kind}
                  </span>
                )}
                <span className="abstract" data-ice="abstract">
                  {doc.abstract ? 'abstract' : ''}
                </span>
                <span className="override" data-ice="override" />
              </td>
              */}
              <td>
                <div>
                  <p>
                    {kindIcon && (
                      <span
                        data-ice="kind-icon"
                        className={`kind-${kindKindIcon}`}
                      >
                        {kindKindIcon.charAt(0).toUpperCase()}
                      </span>
                    )}
                    <span data-ice="async">{doc.async ? 'async' : ''}</span>
                    <span data-ice="generator">{doc.generator ? '*' : ''}</span>
                    {/* Custom return if 'constructor' */}
                    {doc.kind === 'constructor' ? (
                      `new ${doc.longname.match(/~([^)]+)#constructor/)[1]}()`
                    ) : (
                      <>
                        <span className="code" data-ice="name">
                          <DocLinkHTML
                            longname={doc.longname}
                            text={null}
                            inner={innerLink}
                            kind={doc.kind}
                          />
                        </span>
                        <span className="code" data-ice="signature">
                          <SignatureHTML doc={doc} />
                        </span>
                      </>
                    )}
                  </p>
                </div>
              </td>
              <td>
                <div>
                  <div className="deprecated" data-ice="deprecated">
                    <DeprecatedHTML doc={doc} />
                  </div>
                  <div className="experimental" data-ice="experimental">
                    <ExperimentalHTML doc={doc} />
                  </div>

                  <div data-ice="description">
                    <Markdown source={doc.description} />
                  </div>
                  <div data-ice="inherited">
                    {showInheritedHref(doc.memberof, memberof)}
                  </div>
                </div>
              </td>
              {doc.version || doc.since ? (
                <td>
                  {doc.version && (
                    <span className="version" data-ice="version">
                      {doc.version}{' '}
                    </span>
                  )}
                  {doc.since && (
                    <span className="since" data-ice="since">
                      {doc.since}{' '}
                    </span>
                  )}
                </td>
              ) : null}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};
export default React.memo(SummaryDoc);
