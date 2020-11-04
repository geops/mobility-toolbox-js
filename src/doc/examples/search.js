import { transform } from 'ol/proj';
import { StopsAPI } from '../../api';

export default () => {
  const api = new StopsAPI({
    params: { limit: 20 },
    apiKey: window.apiKey,
  });

  const resultDiv = document.getElementById('results');
  document.getElementById('search').onkeyup = (evt) => {
    api.search({ limit: 30, q: evt.target.value }).then((data) => {
      resultDiv.innerHTML = '';

      data.features.forEach(({ properties, geometry }) => {
        const a = document.createElement('a');
        const coord = transform(geometry.coordinates, 'EPSG:4326', 'EPSG:3857');
        a.href = `https://tracker.geops.de?x=${coord[0]}&y=${coord[1]}`;
        a.innerText = `${properties.name} → `;
        resultDiv.appendChild(a);
      });
    });
  };
};
