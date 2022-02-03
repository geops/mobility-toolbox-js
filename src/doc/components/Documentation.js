import React, { useEffect, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { useParams, useLocation } from 'react-router-dom';
import Esdoc from './Esdoc/Esdoc';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexGrow: 1,
    justifyContent: 'center',
    height: '100%',
  },
  iframe: {
    flexGrow: 1,
    border: 0,
    overflow: 'hidden',
  },
});

function Documentation() {
  const classes = useStyles();
  const params = useParams();
  const { hash } = useLocation();
  const [path, setPath] = useState('identifiers%20html');

  useEffect(() => {
    const matchPath = (params || {})['*'];
    if (matchPath) {
      setPath(matchPath.replace(/ /g, '.') + hash);
    }
  }, [params, hash]);

  return (
    <div className={classes.root}>
      <Esdoc path={path} />
    </div>
  );
}

export default React.memo(Documentation);
