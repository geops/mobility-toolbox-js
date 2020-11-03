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

      data.features.forEach(({ properties }) => {
        const span = document.createElement('div');
        // eslint-disable-next-line
        span.style.color = `#${(((1 << 24) * Math.random()) | 0).toString(16)}`;
        span.style.fontSize = `${100 * (1 - properties.rank)}%`;
        span.innerText = properties.name;
        resultDiv.appendChild(span);
      });
    });
  };
};
