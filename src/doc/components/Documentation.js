import React from 'react';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexGrow: 1,
    justifyContent: 'center',
    height: '100%',
  },
  iframe: {
    flexGrow: 1,
    overflowY: 'visible',
    border: 0,
  },
});

const Documentation = () => {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <iframe
        title="API documentation"
        src="apidoc/identifiers.html"
        className={classes.iframe}
      />
    </div>
  );
};

export default React.memo(Documentation);
