import React, { useEffect } from 'react';
import { makeStyles } from '@material-ui/core';
import { Map } from 'maplibre-gl';
import { TralisLayer } from '../../../src/mapbox';

const useStyles = makeStyles({
  root: {
    width: '100%',
    height: 300,
    pointerEvents: 'none',
  },
});

function TrackerExample() {
  const classes = useStyles();

  useEffect(() => {
    const map = new Map({
      container: 'map',
      style: `https://maps.geops.io/styles/travic_v2/style.json?key=${window.apiKey}`,
      center: [7.4707, 46.95],
      zoom: 12,
    });

    const tracker = new TralisLayer({
      url: 'wss://api.geops.io/tracker-ws/v1/',
      apiKey: window.apiKey,
      isQueryable: false,
    });

    tracker.attachToMap(map);
  }, []);

  return <div id="map" className={classes.root} />;
}

export default TrackerExample;