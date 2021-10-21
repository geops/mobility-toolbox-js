import { translateTrajCollResponse } from './TrajservAPIUtils';

let abortController = new AbortController();

// eslint-disable-next-line no-restricted-globals, func-names
self.onmessage = function (evt) {
  // console.log('Worker: Message received from main script', evt.data);
  abortController.abort();
  abortController = new AbortController();
  fetch(evt.data, {
    signal: abortController.signal,
  })
    .then((res) => res.json())
    .then((data) => {
      const a = translateTrajCollResponse(data.features);
      // eslint-disable-next-line no-restricted-globals
      self.postMessage(a);
    })
    .catch(() => {
      // eslint-disable-next-line no-restricted-globals
      self.postMessage(null);
    });
};
