/* eslint-disable react/prop-types */
/* eslint-disable no-continue */
/* eslint-disable no-restricted-syntax */
/* eslint-disable react/no-array-index-key */
/* eslint-disable no-underscore-dangle */
import React, { useState } from 'react';
import { _find } from './DocBuilderUtils';
import SummaryDoc from './SummaryDoc';
import DocLinkHTML from './DocLinkHTML';

/**
 * See InhertiedSummaryHTML component.
 */
const InheritedSummaryDoc = ({ longname, kind }) => {
  const [open, setOpen] = useState('closed');
  const superDoc = _find({ longname })[0];

  if (!superDoc) return null;

  const toggle = () => {
    if (open === 'closed') setOpen('opened');
    else setOpen('closed');
  };

  const targetDocs = _find({
    memberof: longname,
    kind: kind ? [kind] : ['member', 'method', 'get', 'set'],
  });

  targetDocs.sort((a, b) => {
    if (a.static !== b.static) return -(a.static - b.static);

    let order = { get: 0, set: 0, member: 1, method: 2 };
    if (order[a.kind] !== order[b.kind]) {
      return order[a.kind] - order[b.kind];
    }

    order = { public: 0, protected: 1, private: 2 };
    if (a.access !== b.access) return order[a.access] - order[b.access];

    if (a.name !== b.name) return a.name < b.name ? -1 : 1;

    order = { get: 0, set: 1, member: 2 };
    return order[a.kind] - order[b.kind];
  });

  const title = (
    <>
      <span
        onClick={toggle}
        onKeyPress={(evt) => {
          if (evt.which === 13) {
            toggle();
          }
        }}
        role="button"
        tabIndex="0"
      >
        <span className={`toggle ${open}`} /> From {superDoc.kind}{' '}
        <DocLinkHTML longname={longname} text={superDoc.name} />
      </span>
    </>
  );
  return (
    <SummaryDoc
      docs={targetDocs}
      title={title}
      style={{ display: open === 'opened' ? 'block' : 'none' }}
    />
  );
};
export default React.memo(InheritedSummaryDoc);
