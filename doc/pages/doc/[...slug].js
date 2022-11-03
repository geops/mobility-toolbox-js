import React from 'react';
import { Container, makeStyles } from '@material-ui/core';
import Documentation from '../../src/components/Documentation';

const useStyles = makeStyles({
  root: {
    flexGrow: 1,
    overflowY: 'auto',
    padding: 0,
  },
});

function ApiPage() {
  const classes = useStyles();
  return (
    <Container className={classes.root}>
      <Documentation />
    </Container>
  );
}

export default ApiPage;
