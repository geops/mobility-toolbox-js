class Engine {
  constructor(options = {}) {
    this.collapsed = options.collapsed;
    this.items = [];
    this.apiKey = options.apiKey;
  }

  collapse(collapsed) {
    this.collapsed = collapsed;
  }

  getItems() {
    return this.collapsed ? this.items.slice(0, 2) : this.items;
  }

  setApiKey(apiKey) {
    this.apiKey = apiKey;
  }

  setItems(items = []) {
    this.items = items;
  }
}

export default Engine;
