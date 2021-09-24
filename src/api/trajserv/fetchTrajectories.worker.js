import { translateTrajCollResponse } from './TrajservAPIUtils';

let abortController = new AbortController();

self.onmessage = function (evt) {
  // console.log('Worker: Message received from main script', evt.data);
  abortController.abort();
  abortController = new AbortController();
  fetch(evt.data, {
    signal: abortController.signal,
  })
    .then((res) => res.json())
    .then((data) => {
      // console.log('DATAAATTT', data);
      const a = translateTrajCollResponse(data.features);
      // console.log('DATAAATTT', a);
      self.postMessage(a);
    })
    .catch(() => {
      self.postMessage(null);
    });
};
