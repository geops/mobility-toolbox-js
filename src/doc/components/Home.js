import React, { useState, useEffect } from 'react';
import Markdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import Typography from '@material-ui/core/Typography';
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
import { Map, TralisLayer } from 'mobility-toolbox-js/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

const map = new Map({
  container: 'map',
  style: 'https://maps.geops.io/styles/travic_v2/style.json?key=' + window.apiKey,
  center: [7.4707, 46.95],
  zoom: 12,
});
`;

const codeTracker = `
const tracker = new TralisLayer({
  url: 'https://api.geops.io/tracker/v1',
  apiKey: window.apiKey,
});

map.addLayer(tracker);
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

  const MarkdownHeading = ({ ...props }) => {
    const { level, children } = props;
    return <Typography variant={`h${level}`}>{children}</Typography>;
  };

  const renderers = {
    heading: MarkdownHeading,
  };

  return (
    <>
      <Markdown source={source} renderers={renderers} />
      <br />
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
        Finally, add the <i>TralisLayer</i> for rendering real time vehicle
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
