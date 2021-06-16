/* eslint-disable react/prop-types */
import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import Hidden from '@material-ui/core/Hidden';
import EsdocContent from './EsdocContent';
import EsdocNavigation from './EsdocNavigation';
import EsdocSearch from './EsdocSearch';
import './css/style.css';

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
  },
  content: {
    padding: theme.spacing(1),
    paddingBottom: 200,
    margin: 'auto',
    maxWidth: '740px',
  },
  navWrapper: {
    height: 'calc(100% - 32px)',
    padding: theme.spacing(2),
    backgroundColor: 'rgb(239, 239, 239)',
  },
}));

const Esdoc = ({ path }) => {
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
          <Grid item xs={2} style={{ minWidth: 240, maxWidth: 280 }}>
            <div className={classes.navWrapper}>
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
};

export default React.memo(Esdoc);
