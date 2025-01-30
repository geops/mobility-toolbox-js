/* eslint-disable import/no-relative-packages */
import makeStyles from '@mui/styles/makeStyles';
import { Map } from 'maplibre-gl';
import { CopyrightControl, RealtimeLayer } from 'mobility-toolbox-js/maplibre';
import React, { useEffect } from 'react';

const useStyles = makeStyles({
  root: {
    height: 300,
    pointerEvents: 'none',
    width: '100%',
  },
});

function TrackerExample() {
  const classes = useStyles();

  useEffect(() => {
    const map = new Map({
      attributionControl: false,
      center: [7.4707, 46.95],
      container: 'map',
      style: `https://maps.geops.io/styles/travic_v2/style.json?key=${window.apiKey}`,
      zoom: 12,
    });
    const control = new CopyrightControl();
    map.addControl(control);

    const layer = new RealtimeLayer({
      apiKey: window.apiKey,
    });

    const onLoad = () => {
      map.addLayer(layer);
    };

    map.once('load', onLoad);

    return () => {
      map.off('load', onLoad);
      if (map.getLayer(layer.id)) {
        map.removeLayer(layer);
      }
      map.removeControl(control);
    };
  }, []);

  return <div className={classes.root} id="map" />;
}

export default React.memo(TrackerExample);
