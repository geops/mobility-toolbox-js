import { buffer, containsCoordinate } from 'ol/extent';

const getVehicleAtCoordinate = (e) => {
  // console.log('Worker: Message received from main script', e.data);
  try {
    const [trajectories, coordinate, resolution] = JSON.parse(e.data);
    const ext = buffer([...coordinate, ...coordinate], 10 * resolution);
    const vehicles = [];
    for (let i = 0; i < (trajectories || []).length; i += 1) {
      if (
        trajectories[i].coordinate &&
        containsCoordinate(ext, trajectories[i].coordinate)
      ) {
        vehicles.push(trajectories[i]);
      }
    }

    postMessage(vehicles);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log('Error', err);
  }
};

// eslint-disable-next-line no-restricted-globals
self.addEventListener('message', getVehicleAtCoordinate);
