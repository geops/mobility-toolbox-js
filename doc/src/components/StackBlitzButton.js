import { Button, SvgIcon } from "@mui/material";
import PropTypes from "prop-types";
import React from "react";

const dependencies = {
  "maplibre-gl": "latest",
  "mobility-toolbox-js": "latest",
  lodash: "latest",
  ol: "latest",
};

function StackBlitzButton({ extraFiles = {}, html, js, ...props }) {
  if (!html || !js) {
    return null;
  }

  const files = {
    "index.html": `${html}<script src="index.js" type="module"></script>`,
    "index.js": js
      .replaceAll("${window.apiKey}", window.apiKey)
      .replaceAll("window.apiKey", `'${window.apiKey}'`),
    // maplibre-gl loads its worker via a sibling file Vite's pre-bundler can't resolve.
    "vite.config.mjs": `import { defineConfig } from 'vite';

export default defineConfig({
  optimizeDeps: {
    exclude: ['maplibre-gl'],
  },
});
`,
    "package.json": JSON.stringify(
      {
        dependencies,
        devDependencies: {
          vite: "latest",
        },
        name: "mobility-toolbox-example",
        private: true,
        scripts: {
          start: "vite --host",
        },
        version: "1.0.0",
      },
      null,
      2,
    ),
    ...Object.fromEntries(
      Object.entries(extraFiles).map(([name, value]) => {
        return [name, value?.content ?? value];
      }),
    ),
  };

  return (
    <form
      action="https://stackblitz.com/run"
      method="POST"
      target="_blank"
      {...props}
    >
      <input
        name="project[title]"
        type="hidden"
        value="Mobility Toolbox JS Example"
      />
      {/* "node" template runs a real npm install + npm start via WebContainers,
          unlike "javascript" which uses StackBlitz's legacy in-browser bundler. */}
      <input name="project[template]" type="hidden" value="node" />
      {Object.entries(files).map(([path, content]) => {
        return (
          <input
            key={path}
            name={`project[files][${path}]`}
            type="hidden"
            value={content}
          />
        );
      })}
      <Button
        style={{ padding: "5px 15px" }}
        startIcon={
          <SvgIcon fontSize="large" viewBox="0 0 28 28">
            <path
              d="M12.747 16.273h-7.46L18.925 1.5l-3.671 10.227h7.46L9.076 26.5l3.671-10.227z"
              fill="currentColor"
            />
          </SvgIcon>
        }
        type="submit"
      >
        Edit in StackBlitz
      </Button>
    </form>
  );
}

StackBlitzButton.propTypes = {
  extraFiles: PropTypes.shape(),
  html: PropTypes.string,
  js: PropTypes.string,
};

export default React.memo(StackBlitzButton);
