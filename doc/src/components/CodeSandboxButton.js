import { Button, SvgIcon } from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import { getParameters } from 'codesandbox/lib/api/define';
import PropTypes from 'prop-types';
import React from 'react';

const useStyles = makeStyles({
  button: {
    padding: '5px 15px',
  },
});

function CodeSandboxButton({ extraFiles = {}, html, js, ...props }) {
  const classes = useStyles();

  if (!html || !js) {
    return null;
  }

  const dataSB = {
    files: {
      'index.html': {
        content: `${html}<script src="index.js"></script>`,
      },
      'index.js': {
        content: js
          .replaceAll('${window.apiKey}', window.apiKey)
          .replaceAll('window.apiKey', `'${window.apiKey}'`),
      },
      'package.json': {
        content: {
          dependencies: {
            'maplibre-gl': 'latest',
            'mobility-toolbox-js': 'latest',
            ol: 'latest',
            lodash: 'latest',
          },
          description: 'Mobility example starter project',
          devDependencies: {
            '@babel/core': '7.2.0',
            'parcel-bundler': '^1.6.1',
          },
          keywords: [
            'javascript',
            'starter',
            'mobility-toolbox-js',
            'mobility',
            'toolbox',
          ],
          main: 'index.html',
          name: 'vanilla',
          scripts: {
            build: 'parcel build index.html',
            start: 'parcel index.html --open',
          },
          version: '1.0.0',
        },
      },
      ...extraFiles,
    },
  };
  const dataSBStr = getParameters(dataSB);
  return (
    <form
      action="https://codesandbox.io/api/v1/sandboxes/define"
      method="POST"
      target="_blank"
      {...props}
    >
      <input name="parameters" type="hidden" value={dataSBStr} />
      <Button
        className={classes.button}
        startIcon={
          <SvgIcon fontSize="large">
            <path
              d="M2 6l10.455-6L22.91 6L23 17.95L12.455 24L2 18V6zm2.088 2.481v4.757l3.345 1.86v3.516l3.972 2.296v-8.272L4.088 8.481zm16.739 0l-7.317 4.157v8.272l3.972-2.296V15.1l3.345-1.861V8.48zM5.134 6.601l7.303 4.144l7.32-4.18l-3.871-2.197l-3.41 1.945l-3.43-1.968L5.133 6.6z"
              fill="currentColor"
            />
          </SvgIcon>
        }
        type="submit"
      >
        Edit in Sandbox
      </Button>
    </form>
  );
}

CodeSandboxButton.propTypes = {
  extraFiles: PropTypes.shape(),
  html: PropTypes.string,
  js: PropTypes.string,
};

export default React.memo(CodeSandboxButton);
