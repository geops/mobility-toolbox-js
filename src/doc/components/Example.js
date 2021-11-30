import React, { useState, useEffect } from 'react';
import { Grid, Paper, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { useParams } from 'react-router-dom';
import Markdown from 'react-markdown';
import CodeSandboxButton from './CodeSandboxButton';
import EXAMPLES from '../examples';

const useStyles = makeStyles((theme) => ({
  root: {
    padding: 12,
  },
  htmlContainer: {
    height: 500,
  },
  noPointer: {
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
  readme: {
    '& p': {
      fontSize: 18,
    },
  },
}));

const Example = () => {
  const classes = useStyles();
  const { exampleKey } = useParams((params) => params);
  const example = EXAMPLES.find((e) => e.key === exampleKey);
  const [html, setHtml] = useState();
  const [js, setJs] = useState();
  const [readme, setReadme] = useState();
  const [isNavigable, setIsNavigable] = useState(false);
  const htmlFileName =
    (example.files && example.files.html) || `${exampleKey}.html`;
  const readmeFileName =
    (example.files && example.files.readme) || `${exampleKey}.md`;
  const jsFileName = (example.files && example.files.js) || `${exampleKey}.js`;

  useEffect(() => {
    import(`../examples/${htmlFileName}`).then((h) => {
      // Clean the html loaded by the previous example
      setHtml(null);
      // Load the new html
      setHtml(h.default);

      // const filePath = `../examples/${example.files.js}?dfdf=ocr`;
      // We use this to avoid cache and re-execute the code of the module.
      import(`../examples/${jsFileName}?`).then((module) => {
        module.default();

        fetch(`../examples/${jsFileName}`)
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

      fetch(`../examples/${readmeFileName}`)
        .then((res) => res.status === 200 && res.text())
        .then((md) => setReadme(md))
        .catch(() => setReadme(''));
    });
  }, [example, htmlFileName, jsFileName, readmeFileName]);

  return (
    <div style={{ margin: 'auto', marginTop: 30 }}>
      <Grid container direction="column" spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h1" className="headline">
            {example.name}
          </Typography>
          <Markdown
            className={classes.readme}
            source={example.description || ''}
          />
          <Markdown className={classes.readme} source={readme || ''} />
        </Grid>
        <Grid item xs={12}>
          <Paper className={classes.paper} onClick={() => setIsNavigable(true)}>
            <div
              className={`${classes.htmlContainer} ${
                isNavigable ? '' : classes.noPointer
              }`}
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </Paper>
        </Grid>
        {js && html ? (
          <>
            <Grid item xs={12}>
              <Paper className={classes.paper}>
                <Typography className={classes.fileName}>
                  {jsFileName}
                </Typography>
                <SyntaxHighlighter language="javascript">
                  {js}
                </SyntaxHighlighter>
                <CodeSandboxButton
                  className={classes.editButton}
                  extraFiles={example.extraFiles || {}}
                  html={html}
                  js={js}
                />
              </Paper>
            </Grid>
            <Grid item xs={12}>
              <Paper className={classes.paper}>
                <Typography className={classes.fileName}>
                  {htmlFileName}
                </Typography>
                <SyntaxHighlighter language="html">{html}</SyntaxHighlighter>
                <CodeSandboxButton
                  className={classes.editButton}
                  html={html}
                  js={js}
                  extraFiles={{}}
                />
              </Paper>
            </Grid>
          </>
        ) : null}
      </Grid>
    </div>
  );
};

export default React.memo(Example);
