/* eslint-disable import/no-relative-packages */
import React, { useEffect } from 'react';
import makeStyles from '@mui/styles/makeStyles';
import { Map } from 'maplibre-gl';
import { RealtimeLayer, CopyrightControl } from 'mobility-toolbox-js/maplibre';

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
      attributionControl: false,
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

  return <div id="map" className={classes.root} />;
}

export default React.memo(TrackerExample);
