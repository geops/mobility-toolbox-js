/* eslint-disable react/prop-types */
/* eslint-disable react/no-array-index-key */
/* eslint-disable no-underscore-dangle */
import React, { useMemo } from 'react';
import { _findAccessDocs, _find } from './DocBuilderUtils';
import SummaryDoc from './SummaryDoc';

const accessValues = ['public', 'protected', 'private'];

/**
 * build inherited method/member summary.
 * https://github.com/esdoc/esdoc-plugins/blob/2de5022baa569785a189056a99acd1d7ca8284b7/esdoc-publish-html-plugin/src/Builder/ClassDocBuilder.js#L220
 * @param {DocObject} doc - target class doc.
 * @returns {string} html of inherited method/member from ancestor classes.
 * @private
 */
const SummaryHTML = ({
  doc,
  kind,
  title,
  isStatic = true,
  inherited = false,
}) => {
  const accessDocs = useMemo(() => {
    const classDocs = _findAccessDocs(doc, kind, isStatic);

    if (['class', 'interface'].indexOf(doc.kind) !== -1) {
      const longnames = [
        ...(doc._custom_extends_chains || []),
        // ...doc.implements || [],
        // ...doc._custom_indirect_implements || [],
      ];

      longnames
        .map((longname) => _find({ longname })[0])
        .forEach((d) => {
          // Add inherited methods or members.
          if (inherited) {
            const docVals = _find({
              memberof: d.longname,
              kind: [kind],
              static: isStatic,
            });
            if (docVals.length) {
              docVals.forEach((docV) => {
                const idx = accessValues.indexOf(docV.access);
                if (
                  idx !== -1 &&
                  !classDocs[idx][1].find((el) => el.name === docV.name)
                ) {
                  classDocs[idx][1].push(docV);
                }
              });
            }
          }
        });
    }
    return classDocs;
  }, [doc, kind, isStatic, inherited]);

  return (
    <>
      {accessDocs.map((accessDoc, idx) => {
        const docs = accessDoc[1];
        if (!docs.length) return null;

        let prefix = '';
        if (docs[0].static) prefix = 'Static ';
        const _title = `${prefix}${accessDoc[0]} ${title}`;
        return <SummaryDoc key={idx} docs={docs} title={_title} />;
      })}
    </>
  );
};
export default SummaryHTML;
