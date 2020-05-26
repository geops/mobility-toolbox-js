import React from 'react';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexGrow: 1,
    justifyContent: 'center',
  },
  iframe: {
    flexGrow: 1,
    maxWidth: 1250,
    overflowY: 'visible',
    border: 0,
  },
});

const Documentation = () => {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <iframe
        title="API Documenation"
        src="/build/doc"
        className={classes.iframe}
      />
    </div>
  );
};

export default Documentation;
