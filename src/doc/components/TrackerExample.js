import React, { useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Map, TrajservLayer } from '../../mapbox';

const useStyles = makeStyles({
  root: {
    width: '100%',
    height: 300,
    pointerEvents: 'none',
  },
});

const TrackerExample = () => {
  const classes = useStyles();

  useEffect(() => {
    const map = new Map({
      container: 'map',
      style: `https://maps.geops.io/styles/travic_v2_generalized/style.json?key=${window.apiKey}`,
      center: [7.4707, 46.95],
      zoom: 12,
    });

    const tracker = new TrajservLayer({
      url: 'https://api.geops.io/tracker/v1',
      apiKey: window.apiKey,
    });

    map.on('load', () => {
      tracker.init(map, 'waterway-name');
    });
  }, []);

  return <div id="map" className={classes.root} />;
};

export default TrackerExample;
