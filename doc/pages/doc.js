import React from 'react';
import { Container } from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import Documentation from '../src/components/Documentation';

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
