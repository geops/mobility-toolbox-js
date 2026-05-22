import { Box, Grid, Paper, Typography } from '@mui/material';
import React, { useEffect, useMemo, useState } from 'react';
import Markdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';

import CodeSandboxButton from './CodeSandboxButton';
const paperStyle = {
  display: 'block',
  margin: '20px 0',
  overflow: 'hidden',
  position: 'relative',
  resize: 'horizontal',
};

const editButtonStyle = {
  paddingRight: 10,
  paddingTop: 5,
  position: 'absolute',
  right: 0,
  top: 0,
};
function Example({ example }) {
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
    fetch('https://developer.geops.io/publickey')
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
        <Grid style={{ maxWidth: '100%' }} size={{ xs: 12 }}>
          <Typography className="headline" variant="h1">
            {example.name}
          </Typography>
          <Box
            sx={{
              '& p': {
                fontSize: '18px',
              },
            }}
          >
            <Markdown>{example.description || ''}</Markdown>
          </Box>
          <Box
            sx={{
              '& p': {
                fontSize: '18px',
              },
            }}
          >
            <Markdown>{example.readme || ''}</Markdown>
          </Box>
        </Grid>

        <Grid style={{ maxWidth: '100%' }} size={{ xs: 12 }}>
          <Paper
            sx={paperStyle}
            onClick={() => {
              return setIsNavigable(true);
            }}
          >
            <div
              style={{
                height: 500,
              }}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </Paper>
        </Grid>
        {js && html && (
          <>
            <Grid style={{ maxWidth: '100%' }} size={{ xs: 12 }}>
              <Paper sx={paperStyle}>
                <Typography
                  style={{
                    padding: '10px 0 5px 15px',
                  }}
                >
                  {jsFileName}
                </Typography>
                <SyntaxHighlighter language="javascript">
                  {js}
                </SyntaxHighlighter>
                <CodeSandboxButton
                  style={editButtonStyle}
                  extraFiles={example.extraFiles || {}}
                  html={html}
                  js={js}
                />
              </Paper>
            </Grid>
            <Grid style={{ maxWidth: '100%' }} size={{ xs: 12 }}>
              <Paper sx={paperStyle}>
                <Typography
                  style={{
                    padding: '10px 0 5px 15px',
                  }}
                >
                  {htmlFileName}
                </Typography>
                <SyntaxHighlighter language="html">{html}</SyntaxHighlighter>
                <CodeSandboxButton
                  style={editButtonStyle}
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
