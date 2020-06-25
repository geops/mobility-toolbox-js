import React, { useState, useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Markdown from 'react-markdown';

const useStyles = makeStyles(() => ({
  home: {
    padding: '0 10px',
  },
}));

function Home() {
  const classes = useStyles();
  const [source, setSource] = useState(null);
  useEffect(() => {
    fetch('../../../README.md')
      .then((response) => response.text())
      .then((text) => {
        setSource(text);
      });
  }, []);
  return (
    source && (
      <div className={classes.home}>
        <Markdown source={source} />
      </div>
    )
  );
}
export default Home;
