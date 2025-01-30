import { Grid, Paper, Typography } from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import React, { useEffect, useMemo, useState } from 'react';
import Markdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';

import CodeSandboxButton from './CodeSandboxButton';

const useStyles = makeStyles((theme) => {
  return {
    editButton: {
      paddingRight: 10,
      paddingTop: 5,
      position: 'absolute',
      right: 0,
      top: 0,
    },
    fileName: {
      padding: '10px 0 5px 15px',
    },
    htmlContainer: {
      height: 500,
    },
    noPointer: {
      // Remove pointer events for mobile devices on load
      [theme.breakpoints.down('sm')]: {
        pointerEvents: 'none',
      },
    },
    paper: {
      display: 'block',
      margin: '20px 0',
      overflow: 'hidden',
      position: 'relative',
      resize: 'horizontal',
    },
    readme: {
      '& p': {
        fontSize: 18,
      },
    },
    root: {
      padding: 12,
    },
  };
});

function Example({ example }) {
  const classes = useStyles();
  const [html, setHtml] = useState();
  const [js, setJs] = useState();
  const [isNavigable, setIsNavigable] = useState(false);
  const [apiKey, setApiKey] = useState('');

  const htmlFileName = useMemo(() => {
    const { files, key } = example || {};
    return files?.html || (key && `${key}.html`) || '';
  }, [example]);

  const jsFileName = useMemo(() => {
    const { files, key } = example || {};
    return files?.js || (key && `${key}.js`) || '';
  }, [example]);

  useEffect(() => {
    // Get the public api key
    fetch('https://backend.developer.geops.io/publickey')
      .then((response) => {
        return response.json();
      })
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
      .then((res) => {
        return res.text();
      })
      .then((htmlAsText) => {
        setHtml(htmlAsText);
      })
      .catch(() => {
        return setHtml();
      });

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
      .then((res) => {
        return res.text();
      })
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
      .catch(() => {
        return setJs();
      });
    return () => {
      abortController.abort();
    };
  }, [jsFileName]);

  if (!example) {
    return null;
  }

  return (
    <div style={{ marginTop: 30 }}>
      <Grid container direction="column" spacing={3}>
        <Grid item style={{ maxWidth: '100%' }} xs={12}>
          <Typography className="headline" variant="h1">
            {example.name}
          </Typography>
          <Markdown className={classes.readme}>
            {example.description || ''}
          </Markdown>
          <Markdown className={classes.readme}>{example.readme || ''}</Markdown>
        </Grid>
        <Grid item style={{ maxWidth: '100%' }} xs={12}>
          <Paper
            className={classes.paper}
            onClick={() => {
              return setIsNavigable(true);
            }}
          >
            <div
              className={`${classes.htmlContainer} ${
                isNavigable ? '' : classes.noPointer
              }`}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </Paper>
        </Grid>
        {js && html && (
          <>
            <Grid item style={{ maxWidth: '100%' }} xs={12}>
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
            <Grid item style={{ maxWidth: '100%' }} xs={12}>
              <Paper className={classes.paper}>
                <Typography className={classes.fileName}>
                  {htmlFileName}
                </Typography>
                <SyntaxHighlighter language="html">{html}</SyntaxHighlighter>
                <CodeSandboxButton
                  className={classes.editButton}
                  extraFiles={{}}
                  html={html}
                  js={js}
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
