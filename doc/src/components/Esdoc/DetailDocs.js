/* eslint-disable react/no-unescaped-entities */
/* eslint-disable react/prop-types */
/* eslint-disable no-continue */
/* eslint-disable no-restricted-syntax */
/* eslint-disable react/no-array-index-key */
/* eslint-disable no-underscore-dangle */
import React from 'react';
import SyntaxHighlighter from 'react-syntax-highlighter';
import Markdown from 'react-markdown';
import { parseExample } from './DocBuilderUtils';
import SignatureHTML from './SignatureHTML';
import OverrideMethodDescription from './OverrideMethodDescription';
import FileDocLinkHTML from './FileDocLinkHTML';
import OverrideMethod from './OverrideMethod';
import Properties from './Properties';
import TypeDocLinkHTML from './TypeDocLinkHTML';
import DocLinkHTML from './DocLinkHTML';
import DocsLinkHTML from './DocsLinkHTML';
import ExperimentalHTML from './ExperimentalHTML';
import DeprecatedHTML from './DeprecatedHTML';

/**
 * build detail output html by docs.
 * https://github.com/esdoc/esdoc-plugins/blob/2de5022baa569785a189056a99acd1d7ca8284b7/esdoc-publish-html-plugin/src/Builder/DocBuilder.js#L373
 * @param {DocObject[]} docs - target docs.
 * @param {string} title - detail title.
 * @return {IceCap} detail output.
 * @private
 */
function DetailDocs({ docs, title }) {
  return (
    <>
      <h2 data-ice="title">{title}</h2>
      {docs.map((doc) => {
        const scope = doc.static ? 'static' : 'instance';
        let isFunction = false;
        if (['method', 'constructor', 'function'].indexOf(doc.kind) !== -1)
          isFunction = true;
        if (
          doc.kind === 'typedef' &&
          doc.params &&
          doc.type.types[0] === 'function'
        )
          isFunction = true;
        console.log(doc.export, doc.importPath, doc.importStyle);
        return (
          <div
            className="detail"
            data-ice="detail"
            key={`${scope}-${doc.kind}-${doc.name}`}
            id={`${scope}-${doc.kind}-${doc.name}`}
          >
            <span
              className="anchor-offset"
              id={`${scope}-${doc.kind}-${doc.name}-offset-anchor`}
            />
            <h3 data-ice="anchor">
              {doc.access !== 'public' && (
                <span className="access" data-ice="access">
                  {doc.access}{' '}
                </span>
              )}
              {['member', 'method', 'get', 'set'].includes(doc.kind) && (
                <span data-ice="static">{doc.static ? 'static ' : ''}</span>
              )}
              {['get', 'set'].includes(doc.kind) && (
                <span className="kind" data-ice="kind">
                  {/* {doc.kind} */}
                </span>
              )}
              <span className="abstract" data-ice="abstract">
                {doc.abstract ? 'abstract ' : ''}
              </span>
              <span data-ice="async">{doc.async ? 'async ' : ''}</span>
              <span data-ice="generator">{doc.generator ? '* ' : ''}</span>
              <span className="code" data-ice="name">
                {doc.kind === 'constructor'
                  ? `new ${doc.longname.match(/~([^)]+)#constructor/)[1]}`
                  : doc.name}
              </span>
              <span className="code" data-ice="signature">
                <SignatureHTML doc={doc} />
              </span>
              <span className="right-info">
                {doc.version && (
                  <span className="version" data-ice="version">
                    version {doc.version}
                  </span>
                )}
                {doc.since && (
                  <span className="since" data-ice="since">
                    since {doc.since}
                  </span>
                )}
                <span data-ice="source">
                  <FileDocLinkHTML doc={doc} text="source" />
                </span>
              </span>
            </h3>
            {doc.export && doc.importPath && doc.importStyle && (
              <div data-ice="importPath" className="import-path">
                <SyntaxHighlighter language="js">
                  {`import ${doc.importStyle} from '${doc.importPath}';`}
                </SyntaxHighlighter>
              </div>
            )}
            <div className="experimental" data-ice="experimental">
              <ExperimentalHTML doc={doc} />
            </div>
            <div data-ice="description">
              {doc.description ? (
                <Markdown>{doc.description}</Markdown>
              ) : (
                <OverrideMethodDescription doc={doc} />
              )}
            </div>
            <div data-ice="override" className="hide-no-content">
              <h4>Override:</h4>
              <OverrideMethod doc={doc} />
            </div>
            <div data-ice="properties">
              {isFunction && doc.params && !!doc.params.length && (
                <Properties properties={doc.params} title="Params:" />
              )}
              {!isFunction && doc.properties && !!doc.properties.length && (
                <Properties properties={doc.properties} title="Properties:" />
              )}
            </div>
            {doc.emits && (
              <div data-ice="emitWrap">
                <h4>Emit:</h4>
                <table>
                  <tbody>
                    {doc.emits.map((emitDoc, idx) => {
                      return (
                        <tr key={idx} className="emit" data-ice="emit">
                          <td>
                            <p data-ice="emitName">
                              <DocLinkHTML longname={emitDoc.types[0]} />
                            </p>
                          </td>
                          <td data-ice="emitDesc">
                            <Markdown>{emitDoc.description}</Markdown>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {doc.listens && (
              <div data-ice="listenWrap">
                <h4>Listen:</h4>
                <table>
                  <tbody>
                    {doc.listens.map((listenDoc, idx) => {
                      return (
                        <tr key={idx} className="listen" data-ice="listen">
                          <td>
                            <p data-ice="listenName">
                              <DocLinkHTML longname={listenDoc.types[0]} />
                            </p>
                          </td>
                          <td data-ice="listenDesc">
                            <Markdown>{listenDoc.description}</Markdown>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {doc.throws && (
              <div data-ice="throwWrap">
                <h4>Throw:</h4>
                <table>
                  <tbody>
                    {doc.throws.map((exceptionDoc, idx) => {
                      return (
                        <tr key={idx} className="throw" data-ice="throw">
                          <td>
                            <p data-ice="throwName">
                              <DocLinkHTML longname={exceptionDoc.types[0]} />
                            </p>
                          </td>
                          <td data-ice="throwDesc">
                            <Markdown>{exceptionDoc.description}</Markdown>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {/* TODO
      <div data-ice="decorator">
        <h4>Decorators:</h4>
      </div> */}
            {doc.examples && doc.examples.length && (
              <div data-ice="example">
                <h4>Example:</h4>
                <div className="example-doc" data-ice="exampleDoc">
                  {doc.examples.map((example) => {
                    const parsed = parseExample(example);
                    return (
                      <React.Fragment key={example}>
                        {parsed.caption && (
                          <div
                            className="example-caption"
                            data-ice="exampleCaption"
                          >
                            {parsed.caption}
                          </div>
                        )}
                        <SyntaxHighlighter language="js">
                          {parsed.body}
                        </SyntaxHighlighter>
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            )}
            {/* TODO
      <div data-ice="tests">
        <h4>Test:</h4>
        <ul>
          <li data-ice="test" />
        </ul>
      </div> */}
            <div data-ice="see" className="hide-no-content">
              <h4>See:</h4>
              <DocsLinkHTML longnames={doc.see} />
            </div>
            {/* TODO
      <div data-ice="todo">
        <h4>TODO:</h4>
      </div> */}
          </div>
        );
      })}
    </>
  );
}
export default React.memo(DetailDocs);
