import React, { useState, useEffect, useRef } from 'react';
import { Grid, Paper, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { useParams } from 'react-router-dom';
import CodeSandboxButton from './CodeSandboxButton';
import EXAMPLES from '../examples';

const useStyles = makeStyles((theme) => ({
  root: {
    padding: 12,
  },
  htmlContainer: {
    height: 500,
    // Remove pointer events for mobile devices on load
    [theme.breakpoints.down('xs')]: {
      pointerEvents: 'none',
    },
  },
  paper: {
    position: 'relative',
    margin: '20px 0',
  },
  fileName: {
    padding: '10px 0 5px 15px',
  },
  editButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    paddingTop: 5,
    paddingRight: 10,
  },
}));

const Example = () => {
  const classes = useStyles();
  const { exampleKey } = useParams((params) => params);
  const example = EXAMPLES.find((e) => e.key === exampleKey);
  const [html, setHtml] = useState();
  const [js, setJs] = useState();
  const mapContainerRef = useRef(null);

  useEffect(() => {
    import(`../examples/${example.files.html}`).then((h) => {
      // Clean the html loaded by the previous example
      setHtml(null);
      // Load the new html
      setHtml(h.default);

      // const filePath = `../examples/${example.files.js}?dfdf=ocr`;
      // We use to avoid cache and re-execute the code of the module.
      import(`../examples/${example.files.js}?`).then((module) => {
        module.default();

        fetch(`../examples/${example.files.js}`)
          .then((res) => res.text())
          .then((jsCode) => {
            // Replace relative import by library import
            setJs(
              jsCode
                .replace(/'\.\.\/\.\.\//gm, "'mobility-toolbox-js/")
                .replace('export default () => {\n', '')
                .replace(/^};\n$/gm, '')
                .replace(/^ {2}/gm, ''),
            );
          });
      });
    });
  }, [example]);

  return (
    <Grid container direction="column" spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h1" className="headline">
          {example.name}
        </Typography>
        <Typography>{example.description}</Typography>
      </Grid>
      <Grid item xs={12}>
        <Paper
          className={classes.paper}
          onClick={() => {
            // Activate map interactions on tap for mobile devices
            mapContainerRef.current.style.pointerEvents = 'auto';
          }}
        >
          <div
            ref={mapContainerRef}
            className={classes.htmlContainer}
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </Paper>
      </Grid>
      <Grid item xs={12}>
        <Paper className={classes.paper}>
          <Typography className={classes.fileName}>
            {example.files.js}
          </Typography>
          <SyntaxHighlighter language="javascript">{js}</SyntaxHighlighter>
          <CodeSandboxButton
            className={classes.editButton}
            html={html}
            js={js}
          />
        </Paper>
      </Grid>
      <Grid item xs={12}>
        <Paper className={classes.paper}>
          <Typography className={classes.fileName}>
            {example.files.html}
          </Typography>
          <SyntaxHighlighter language="html">{html}</SyntaxHighlighter>
          <CodeSandboxButton
            className={classes.editButton}
            html={html}
            js={js}
          />
        </Paper>
      </Grid>
    </Grid>
  );
};

export default React.memo(Example);
