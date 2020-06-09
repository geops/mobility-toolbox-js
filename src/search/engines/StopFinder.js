import Engine from './Engine';
import { StopsAPI } from '../../api';

class StopFinder extends Engine {
  constructor(options = {}) {
    super();
    this.api = new StopsAPI({ url: options.url, apiKey: options.apiKey });
  }

  search(q) {
    return this.api.search({
      q,
    });
  }

  render(item) {
    return item.properties.name;
  }

  static value(item) {
    return item.properties.name;
  }
}

export default StopFinder;
