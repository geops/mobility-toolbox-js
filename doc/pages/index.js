import React from 'react';
import { Container } from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import Home from '../src/components/Home';

const useStyles = makeStyles({
  content: {
    flexGrow: 1,
    overflowY: 'auto',
    paddingBottom: 115,
    margin: 'auto',
    marginTop: 30,
  },
});

function HomePage() {
  const classes = useStyles();
  return (
    <Container className={classes.content}>
      <Home />
    </Container>
  );
}

export default HomePage;
