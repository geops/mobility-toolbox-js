import StopFinder from '../../search/engines/StopFinder';
import SearchService from '../../search/SearchService';

export default () => {
  const input = document.getElementById('search');
  const results = document.getElementById('results');

  const stops = new StopFinder({ apiKey: window.apiKey });
  const manager = new SearchService({
    engines: {
      stops,
    },
    setSuggestions: () => {
      results.innerHTML = '';
      stops.getItems().forEach((item) => {
        const newDiv = document.createElement('div');
        const newContent = document.createTextNode(item.properties.name);
        newDiv.appendChild(newContent);
        results.appendChild(newDiv);
      });
    },
  });

  input.onkeyup = ({ target: { value } }) => {
    manager.search(value);
  };
};
