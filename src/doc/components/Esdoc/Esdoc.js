/* eslint-disable react/prop-types */
import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import Hidden from '@material-ui/core/Hidden';
import EsdocContent from './EsdocContent';
import EsdocNavigation from './EsdocNavigation';
import SearchDoc from './SearchDoc';
import './css/style.css';

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
  },
  navigation: {
    padding: theme.spacing(1),
  },
  content: {
    padding: theme.spacing(1),
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
        <Grid container>
          <Grid item xs={3} className={classes.navigation}>
            <SearchDoc />
            <EsdocNavigation />
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
