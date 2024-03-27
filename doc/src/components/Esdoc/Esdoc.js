/* eslint-disable react/prop-types */
/* eslint-disable import/no-relative-packages */
import React from 'react';
import makeStyles from '@mui/styles/makeStyles';
import Grid from '@mui/material/Grid';
import Hidden from '@mui/material/Hidden';
import { version } from '../../../../package.json';
import EsdocContent from './EsdocContent';
import EsdocNavigation from './EsdocNavigation';
import EsdocSearch from './EsdocSearch';

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
  },
  content: {
    padding: theme.spacing(1),
    paddingBottom: 115,
    margin: '0 auto',
    maxWidth: '740px',
  },
  navWrapper: {
    height: 'calc(100% - 32px)',
    padding: theme.spacing(2),
    backgroundColor: 'rgb(239, 239, 239)',
  },
}));

function Esdoc({ path }) {
  const classes = useStyles();

  if (!path) {
    return null;
  }

  return (
    <div className={`esdoc ${classes.root}`}>
      <Hidden smUp>
        <Grid container>
          <Grid item xs={12} className={classes.content}>
            <EsdocContent path={path} />
          </Grid>
        </Grid>
      </Hidden>
      <Hidden only="xs">
        <Grid container wrap="nowrap">
          <Grid item style={{ minWidth: 260, maxWidth: 300 }}>
            <div className={classes.navWrapper}>
              {version}
              <EsdocSearch />
              <EsdocNavigation />
            </div>
          </Grid>
          <Grid item xs={9} className={classes.content}>
            <EsdocContent path={path} />
          </Grid>
        </Grid>
      </Hidden>
    </div>
  );
}

export default React.memo(Esdoc);
