import React, { useEffect, useState } from 'react';
import makeStyles from '@mui/styles/makeStyles';
import { useRouter } from 'next/router';
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
