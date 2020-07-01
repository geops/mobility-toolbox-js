/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import docss from './index.json';
import ClassDocBuilder from './ClassDocBuilder';
import {
  _resolveExtendsChain,
  _resolveNecessary,
  _resolveIgnore,
  _resolveLink,
} from './DocBuilderUtils';
import './css/style.css';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexGrow: 1,
    justifyContent: 'center',
    height: '100%',
    width: '100%',
  },
});

// Preprocess the index.json content.
// https://github.com/esdoc/esdoc-plugins/blob/2de5022baa569785a189056a99acd1d7ca8284b7/esdoc-publish-html-plugin/src/Builder/DocResolver.js
let docs = _resolveExtendsChain(docss);
docs = _resolveNecessary(docs);
docs = _resolveIgnore(docs);
docs = _resolveLink(docs);

const Esdoc = ({ path }) => {
  const classes = useStyles();
  let doc;
  if (path) {
    const [longName, hash] = path.replace('class/', '').split('#');
    doc = docs.find((item) => {
      const [docLongName, docHash] = item.longname.split('#');
      const reg = new RegExp(docLongName);
      if (reg.test(path) && item.kind === 'class') {
        return item;
      }
      return null;
    });
  }

  return (
    <div className={`esdoc ${classes.root}`}>
      <div className="content">
        <ClassDocBuilder doc={doc} />
      </div>
    </div>
  );
};

export default React.memo(Esdoc);
