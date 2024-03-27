/* eslint-disable no-underscore-dangle */
/* eslint-disable react/prop-types */
import React from 'react';
import makeStyles from '@mui/styles/makeStyles';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import Markdown from 'react-markdown';
import FileDocLinkHTML from './FileDocLinkHTML';
import MixinClassesHTML from './MixinClassesHTML';
import ExtendsChainHTML from './ExtendsChainHTML';
import DirectSubclassHTML from './DirectSubclassHTML';
import IndirectSubclassHTML from './IndirectSubclassHTML';
import DocsLinkHTML from './DocsLinkHTML';
import SummaryHTML from './SummaryHTML';
import DetailHTML from './DetailHTML';
import ExperimentalHTML from './ExperimentalHTML';
import DeprecatedHTML from './DeprecatedHTML';
import { parseExample } from './DocBuilderUtils';

const useStyles = makeStyles({
  root: {
    height: '100%',
    width: '100%',
  },
});

/**
 * build class output.
 * https://github.com/esdoc/esdoc-plugins/blob/2de5022baa569785a189056a99acd1d7ca8284b7/esdoc-publish-html-plugin/src/Builder/ClassDocBuilder.js#L30
 * @param {DocObject} doc - class doc object.
 * @returns {IceCap} built output.
 * @private
 */
function ClassDoc({ doc }) {
  const classes = useStyles();
  if (!doc) {
    return null;
  }
  const { name, access, version, since } = doc;

  return (
    <div className={classes.root}>
      <div className="header-notice">
        {/*
        doc.export && importPath && importStyle && (
          <div data-ice="importPath" className="import-path">
            <SyntaxHighlighter language="js">
              {`import ${importStyle} from '${importPath}';`}
            </SyntaxHighlighter>
          </div>
        )
        */}
        <span>{access}</span>
        <span>{doc.interface ? ' interface' : ' class'}</span>
        {/* TODO
        <span data-ice="variation"> | variation </span> */}
        {version && <span> | {version}</span>}
        {since && <span> | {since}</span>}
        <span>
          | <FileDocLinkHTML doc={doc} text="source" />
        </span>
      </div>

      <div className="self-detail detail">
        <h1>{name}</h1>
        {/* TODO 
        <div data-ice="instanceDocs" className="instance-docs">
          <span>You can directly use an instance of this class.</span>
          <span data-ice="instanceDoc" />
        </div> */}
        {/* TODO
        <div className="expression-extends" data-ice="expressionExtends">
          <h4>Expression Extends:</h4>
          <pre className="prettyprint">
            <code data-ice="expressionExtendsCode" />
          </pre>
        </div> */}
        <MixinClassesHTML doc={doc} />
        <ExtendsChainHTML doc={doc} />
        <DirectSubclassHTML doc={doc} />
        <IndirectSubclassHTML doc={doc} />
        {doc.implements && doc.implements.length && (
          <div className="flat-list" data-ice="implements">
            <h4>Implements:</h4>
            <DocsLinkHTML
              longnames={doc.implements}
              text={null}
              inner={false}
              separator=", "
            />
          </div>
        )}
        {doc._custom_indirect_implements &&
          doc._custom_indirect_implements.length && (
            <div className="flat-list" data-ice="indirectImplements">
              <h4>Indirect Implements:</h4>
              <DocsLinkHTML
                longnames={doc._custom_indirect_implements}
                text={null}
                inner={false}
                separator=", "
              />
            </div>
          )}
        {doc._custom_direct_implemented &&
          doc._custom_direct_implemented.length && (
            <div className="flat-list" data-ice="directImplemented">
              <h4>Direct Implemented:</h4>
              <DocsLinkHTML
                longnames={doc._custom_direct_implemented}
                text={null}
                inner={false}
                separator=", "
              />
            </div>
          )}
        {doc._custom_indirect_implemented &&
          doc._custom_indirect_implemented.length && (
            <div className="flat-list" data-ice="indirectImplemented">
              <h4>Indirect Implemented:</h4>
              <DocsLinkHTML
                longnames={doc._custom_indirect_implemented}
                text={null}
                inner={false}
                separator=", "
              />
            </div>
          )}
        <div className="deprecated" data-ice="deprecated">
          <DeprecatedHTML doc={doc} />
        </div>
        <div className="experimental" data-ice="experimental">
          <ExperimentalHTML doc={doc} />
        </div>
        <div className="description">
          <Markdown>{doc.description}</Markdown>
        </div>
        {/* TODO
        <div className="decorator" data-ice="decorator">
          <h4>Decorators:</h4>
        </div> */}
        {doc.see && doc.see.length && (
          <div data-ice="see">
            <h4>See:</h4>
            <DocsLinkHTML longnames={doc.see} />
          </div>
        )}
        {doc.examples && doc.examples.length && (
          <div data-ice="exampleDocs">
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
                    {/* <pre className="prettyprint source-code"> */}
                    {parsed.body ? (
                      <SyntaxHighlighter language="js">
                        {parsed.body}
                      </SyntaxHighlighter>
                    ) : null}
                    {/* </pre> */}
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
        {doc.todo && doc.todo.length && (
          <div data-ice="todo">
            <h4>TODO:</h4>
            <DocsLinkHTML longnames={doc.todo} />
          </div>
        )}
      </div>

      <div data-ice="staticMemberSummary" className="hide-no-content">
        <h2>Static Member Summary</h2>
        <SummaryHTML doc={doc} kind="member" title="Members" isStatic />
      </div>
      <div data-ice="staticMethodSummary" className="hide-no-content">
        <h2>Static Method Summary</h2>
        <SummaryHTML doc={doc} kind="method" title="Methods" isStatic />
      </div>
      <div data-ice="constructorSummary" className="hide-no-content">
        <h2>Constructor Summary</h2>
        <SummaryHTML
          doc={doc}
          kind="constructor"
          title="Constructor"
          isStatic={false}
        />
      </div>
      <div data-ice="memberSummary" className="hide-no-content">
        <h2>Member Summary</h2>
        <SummaryHTML
          doc={doc}
          kind="member"
          title="Members"
          isStatic={false}
          inherited
        />
        {/*
        <div
          className="inherited-summary hide-no-content"
          data-ice="inheritedSummary"
        >
          <h2>Inherited Member Summary</h2>
          <InheritedSummaryHTML doc={doc} kind="member" />
        </div>
        */}
      </div>
      <div data-ice="methodSummary" className="hide-no-content">
        <h2>Method Summary</h2>
        <SummaryHTML
          doc={doc}
          kind="method"
          title="Methods"
          isStatic={false}
          inherited
        />
        {/*
        <div
          className="inherited-summary hide-no-content"
          data-ice="inheritedSummary"
        >
          <h2>Inherited Member Summary</h2>
          <InheritedSummaryHTML doc={doc} kind="method" />
        </div>
        */}
      </div>

      <div data-ice="staticMemberDetails">
        <DetailHTML doc={doc} kind="member" title="Members" isStatic />
      </div>
      <div data-ice="staticMethodDetails">
        <DetailHTML doc={doc} kind="method" title="Methods" isStatic />
      </div>
      <div data-ice="constructorDetails">
        <DetailHTML
          doc={doc}
          kind="constructor"
          title="Constructors"
          isStatic={false}
        />
      </div>
      <div data-ice="memberDetails">
        <DetailHTML doc={doc} kind="member" title="Members" isStatic={false} />
      </div>
      <div data-ice="methodDetails">
        <DetailHTML doc={doc} kind="method" title="Methods" isStatic={false} />
      </div>
    </div>
  );
}

export default React.memo(ClassDoc);
