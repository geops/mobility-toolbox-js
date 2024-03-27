import React, { useState, useEffect } from 'react';
import Markdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import TrackerExample from './TrackerExample';

const codeHtmlPage = `
<html>
  <head>
    <title>Realtime map</title>
  </head>
  <body>
    <div id="map" style="height: 300px; width: 100%" />
  </body>
</html>
`;

const codeMapObject = `
import { Map } from 'maplibre-gl;
import { RealtimeLayer } from 'mobility-toolbox-js/mapbox';


const map = new Map({
  container: 'map',
  style: 'https://maps.geops.io/styles/travic_v2/style.json?key=' + window.apiKey,
  center: [7.4707, 46.95],
  zoom: 12,
});
`;

const codeTracker = `
const tracker = new RealtimeLayer({
  url: 'wss://api.geops.io/tracker-ws/v1/',
  apiKey: window.apiKey,
});

tracker.attachToMap(map);
`;

function MarkdownHeading({ ...props }) {
  // eslint-disable-next-line react/prop-types
  const { node, children } = props;
  return <Typography variant={node.tagName}>{children}</Typography>;
}

function Home() {
  const [source, setSource] = useState(null);
  const [apiKey, setApiKey] = useState('');

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
    fetch('/README.md')
      .then((response) => response.text())
      .then((text) => {
        // only show the 'Documentation and examples' section on GitHub
        const noDocText = text.split('## Documentation')[0];
        setSource(noDocText);
      });
  }, []);

  if (!source || !apiKey) {
    return null;
  }

  const renderers = {
    h1: MarkdownHeading,
  };

  return (
    <>
      <Markdown components={renderers}>{source}</Markdown>
      <br />
      <h2>Quick Start</h2>
      <TrackerExample />
      <p>
        This example shows how to draw real time vehicle positions on a{' '}
        <a
          href="https://maplibre.org/maplibre-gl-js-docs/"
          rel="noreferrer"
          target="_blank"
        >
          Maplibre GL JS
        </a>{' '}
        map. Check out the{' '}
        <Link href="/examples/ol-tracker">Live Tracker with OpenLayers</Link>{' '}
        example to see how to use{' '}
        <a href="https://openlayers.org/" target="_blank" rel="noreferrer">
          OpenLayers
        </a>{' '}
        instead.
      </p>
      <p>First, create a HTML page with an empty map container.</p>
      <SyntaxHighlighter language="html" code={codeHtmlPage.trim()} />
      <p>Create a Maplibre map.</p>
      <SyntaxHighlighter language="js" code={codeMapObject.trim()} />
      <p>
        Finally, add the <i>RealtimeLayer</i> for rendering real time vehicle
        positions from our Realtime API. For more information about the backend
        and for obtaining the required API-Key, visit our Developer Portal at{' '}
        <a target="_blank" rel="noreferrer" href="https://geops.io">
          https://geops.io
        </a>
        .
      </p>
      <SyntaxHighlighter language="js" code={codeTracker.trim()} />
    </>
  );
}
export default Home;
