import React from 'react';
import PropTypes from 'prop-types';
import { getParameters } from 'codesandbox/lib/api/define';
import { Button, SvgIcon } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles({
  button: {
    padding: '5px 15px',
  },
});

const CodeSandboxButton = ({ html, js, ...props }) => {
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
        content: js // eslint-disable-next-line no-template-curly-in-string
          .replace('${window.apiKey}', window.apiKey)
          .replace('window.apiKey', `'${window.apiKey}'`),
      },
      'package.json': {
        content: {
          name: 'vanilla',
          version: '1.0.0',
          description: 'Mobility example starter project',
          main: 'index.html',
          scripts: {
            start: 'parcel index.html --open',
            build: 'parcel build index.html',
          },
          dependencies: {
            'mapbox-gl': '1.11.1',
            'mobility-toolbox-js': 'latest',
            ol: '6.3.1',
            'query-string': '6.13.1',
          },
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
        },
      },
    },
  };
  const dataSBStr = getParameters(dataSB);
  return (
    <form
      action="https://codesandbox.io/api/v1/sandboxes/define"
      method="POST"
      target="_blank"
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
    >
      <input type="hidden" name="parameters" value={dataSBStr} />
      <Button
        type="submit"
        className={classes.button}
        startIcon={
          <SvgIcon fontSize="large">
            <path
              d="M2 6l10.455-6L22.91 6L23 17.95L12.455 24L2 18V6zm2.088 2.481v4.757l3.345 1.86v3.516l3.972 2.296v-8.272L4.088 8.481zm16.739 0l-7.317 4.157v8.272l3.972-2.296V15.1l3.345-1.861V8.48zM5.134 6.601l7.303 4.144l7.32-4.18l-3.871-2.197l-3.41 1.945l-3.43-1.968L5.133 6.6z"
              fill="currentColor"
            />
          </SvgIcon>
        }
      >
        Edit in Sandox
      </Button>
    </form>
  );
};

CodeSandboxButton.propTypes = {
  html: PropTypes.string,
  js: PropTypes.string,
};

CodeSandboxButton.defaultProps = {
  html: null,
  js: null,
};

export default React.memo(CodeSandboxButton);
