import makeStyles from '@mui/styles/makeStyles';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

import Esdoc from './Esdoc/Esdoc';

const useStyles = makeStyles({
  iframe: {
    border: 0,
    flexGrow: 1,
    overflow: 'hidden',
  },
  root: {
    display: 'flex',
    flexGrow: 1,
    height: '100%',
    justifyContent: 'center',
  },
});

function Documentation() {
  const classes = useStyles();
  const {
    query: { slug },
  } = useRouter();
  // const params = useParams();
  // const { hash } = useLocation();
  const [path, setPath] = useState('identifiers%20html');

  useEffect(() => {
    if (slug?.length) {
      setPath(slug.join('/').replace(/ /g, '.'));
    }
  }, [slug]);

  return (
    <div className={classes.root}>
      <Esdoc path={path} />
    </div>
  );
}

export default React.memo(Documentation);
