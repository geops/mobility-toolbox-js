import React, { useEffect, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { useRouteMatch, useLocation } from 'react-router';
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

const Documentation = () => {
  const classes = useStyles();
  const match = useRouteMatch();
  const { hash } = useLocation();
  const [path, setPath] = useState('identifiers.html');

  useEffect(() => {
    const matchPath = match.params.path;
    if (matchPath) {
      setPath(matchPath.replace(/ /g, '.') + hash);
    }
  }, [match, hash]);

  return (
    <div className={classes.root}>
      <Esdoc path={path} />
    </div>
  );
};

export default React.memo(Documentation);
