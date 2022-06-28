import React from 'react';
import { Container, makeStyles } from '@material-ui/core';
import Examples from '../src/components/Examples';
import EXAMPLES from '../src/examples';

const useStyles = makeStyles({
  content: {
    flexGrow: 1,
    overflowY: 'auto',
    paddingBottom: 115,
    margin: 'auto',
    marginTop: 30,
  },
});

export async function getStaticProps() {
  return {
    props: {
      examples: EXAMPLES,
    },
  };
}

function ExamplesPage({ examples }) {
  const classes = useStyles();
  return (
    <Container className={classes.content}>
      <Examples examples={examples} />
    </Container>
  );
}

export default ExamplesPage;
