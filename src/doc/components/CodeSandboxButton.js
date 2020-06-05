import React from 'react';
import PropTypes from 'prop-types';
import { getParameters } from 'codesandbox/lib/api/define';

const CodeSandboxButton = ({ html, js }) => {
  if (!html || !js) {
    return null;
  }

  const dataSB = {
    files: {
      'index.html': {
        content: html,
      },
      'main.js': {
        content: js,
      },
      'package.json': {
        content: {
          name: 'mobility-toolbox-js',
          version: '1.0.0',
          main: 'build/index.js',
          module: 'src/index.js',
          dependencies: {
            ol: '^6.3.1',
          },
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
    >
      <input type="hidden" name="parameters" value={dataSBStr} />
      <input type="submit" value="Create New Sandbox with Prefilled Data" />
    </form>
  );
};

CodeSandboxButton.propTypes = {
  html: PropTypes.string.isRequired,
  js: PropTypes.string.isRequired,
};

export default React.memo(CodeSandboxButton);
