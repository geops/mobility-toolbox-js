import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import { makeStyles } from '@material-ui/core/styles';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';

const useStyles = makeStyles({
  example: {
    height: 500,
  },
  code: {
    margin: '20px 0',
  },
  fileName: {
    padding: '10px 0 5px 15px',
  },
});

const propTypes = {
  example: PropTypes.shape({
    name: PropTypes.string,
    description: PropTypes.string,
    files: PropTypes.shape({
      js: PropTypes.string,
      html: PropTypes.string,
    }),
  }).isRequired,
};

const Example = ({ example }) => {
  const classes = useStyles();
  const [html, setHtml] = useState();
  const [js, setJs] = useState();

  useEffect(() => {
    import(`../examples/${example.files.html}`).then((h) => {
      setHtml(h.default);
    });

    import(`../examples/${example.files.js}`).then((m) => {
      m.default();
    });

    fetch(`/build/examples/${example.files.js}`)
      .then((res) => res.text())
      .then((jsCode) => setJs(jsCode));
  }, [example]);

  return (
    <div className={classes.root}>
      <Typography variant="h1">{example.name}</Typography>
      <Typography>{example.description}</Typography>

      <Paper className={classes.code}>
        <div
          className={classes.example}
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </Paper>
      <Paper className={classes.code}>
        <Typography className={classes.fileName}>{example.files.js}</Typography>
        <SyntaxHighlighter language="javascript">{js}</SyntaxHighlighter>
      </Paper>
      <Paper>
        <Typography className={classes.fileName}>
          {example.files.html}
        </Typography>
        <SyntaxHighlighter language="html">{html}</SyntaxHighlighter>
      </Paper>
    </div>
  );
};

Example.propTypes = propTypes;
export default Example;
