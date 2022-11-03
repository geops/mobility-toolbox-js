import React, { useState, useEffect, useMemo } from 'react';
import { Grid, Paper, Typography, makeStyles } from '@material-ui/core';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import Markdown from 'react-markdown';
import CodeSandboxButton from './CodeSandboxButton';

const useStyles = makeStyles((theme) => ({
  root: {
    padding: 12,
  },
  htmlContainer: {
    height: 900,
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

function Example({ example }) {
  const classes = useStyles();
  const [html, setHtml] = useState();
  const [js, setJs] = useState();
  const [isNavigable, setIsNavigable] = useState(false);
  const [apiKey, setApiKey] = useState('');

  const htmlFileName = useMemo(() => {
    const { key, files } = example || {};
    return files?.html || (key && `${key}.html`) || '';
  }, [example]);

  const jsFileName = useMemo(() => {
    const { key, files } = example || {};
    return files?.js || (key && `${key}.js`) || '';
  }, [example]);

  useEffect(() => {
    // Get the public api key
    fetch('https://backend.developer.geops.io/publickey')
      .then((response) => response.json())
      .then((data) => {
        if (data && data.success) {
          window.apiKey = data.key;
          setApiKey(data.key);
        }
      });
  }, []);

  useEffect(() => {
    setHtml();

    if (!htmlFileName) {
      return () => {};
    }

    const abortController = new AbortController();

    fetch(`/static/examples/${htmlFileName}`, {
      signal: abortController.signal,
    })
      .then((res) => res.text())
      .then((htmlAsText) => {
        setHtml(htmlAsText);
      })
      .catch(() => setHtml());

    return () => {
      abortController.abort();
    };
  }, [htmlFileName]);

  // Execute the content of the js file
  useEffect(() => {
    if (!jsFileName || !html || !apiKey) {
      return;
    }
    import(`../../public/static/examples/${jsFileName}`).then((module) => {
      module.default();
    });
  }, [html, apiKey, jsFileName]);

  // Load the content of the js file
  useEffect(() => {
    if (!jsFileName) {
      return () => {};
    }

    const abortController = new AbortController();
    fetch(`/static/examples/${jsFileName}`, {
      signal: abortController.signal,
    })
      .then((res) => res.text())
      .then((jsCode) => {
        // Replace relative import by library import
        setJs(
          jsCode
            .replace(
              /'\.\.\/\.\.\/\.\.\/\.\.\/src\//gm,
              "'mobility-toolbox-js/",
            )
            .replace('export default () => {\n', '')
            .replace(/^};\n$/gm, '')
            .replace(/^ {2}/gm, ''),
        );
      })
      .catch(() => setJs());
    return () => {
      abortController.abort();
    };
  }, [jsFileName]);

  if (!example) {
    return null;
  }

  return (
    <div style={{ margin: 'auto', marginTop: 30 }}>
      <Grid container direction="column" spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h1" className="headline">
            {example.name}
          </Typography>
          <Markdown className={classes.readme}>
            {example.description || ''}
          </Markdown>
          <Markdown className={classes.readme}>{example.readme || ''}</Markdown>
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
        {js && html && (
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
        )}
      </Grid>
    </div>
  );
}

export default React.memo(Example);
