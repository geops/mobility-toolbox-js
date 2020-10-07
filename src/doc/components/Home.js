import React, { useState, useEffect } from 'react';
import Markdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import TrackerExample from './TrackerExample';

const codeHtmlPage = `
<html>
  <head>
    <title>Real time map</title>
  </head>
  <body>
    <div id="map" style="height: 300px; width: 100%" />
  </body>
</html>
`;

const codeMapObject = `
import { Map } from 'mapbox-gl';
import { TrajservLayer } from 'mobility-toolbox-js/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

const map = new Map({
  container: 'map',
  style: 'https://maps.geops.io/styles/travic/style.json?key=' + window.apiKey,
  center: [7.4707, 46.95],
  zoom: 12,
});
`;

const codeTracker = `
const tracker = new TrajservLayer({
  url: 'https://api.geops.io/tracker/v1',
  apiKey: window.apiKey,
});

map.on('load', () => {
  // add tracker before layer 'waterway-name'
  tracker.init(map, 'waterway-name');
});
`;

function Home() {
  const [source, setSource] = useState(null);
  useEffect(() => {
    fetch('../../../README.md')
      .then((response) => response.text())
      .then((text) => {
        // only show the 'Documentation and examples' section on GitHub
        const noDocText = text.split('## Documentation')[0];
        setSource(noDocText);
      });
  }, []);

  if (!source) {
    return null;
  }

  return (
    <>
      <Markdown source={source} />
      <h2>Quick Start</h2>
      <TrackerExample />
      <p>
        This example shows how to draw real time vehicle positions on a{' '}
        <a
          href="https://docs.mapbox.com/mapbox-gl-js/"
          rel="noreferrer"
          target="_blank"
        >
          Mapbox GL JS
        </a>{' '}
        map. Check out the{' '}
        <a href="/example/ol-tracker">Live Tracker with OpenLayers</a> example
        to see how to use{' '}
        <a href="https://openlayers.org/" target="_blank" rel="noreferrer">
          OpenLayers
        </a>{' '}
        instead.
      </p>
      <p>First, create a HTML page with an empty map container.</p>
      <SyntaxHighlighter language="html" code={codeHtmlPage.trim()} />
      <p>Add a map object with a vector tile layer.</p>
      <SyntaxHighlighter language="js" code={codeMapObject.trim()} />
      <p>
        Finally, add the <i>TrajservLayer</i> for rendering real time vehicle
        positions from our Real Time API. For more information about the backend
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
