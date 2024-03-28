import CopyrightControl from './CopyrightControl';

describe('CopyrightControl', () => {
  test('should be initialized with good properties and with functions implemented', () => {
    const options = {};
    const control = new CopyrightControl(options);
    expect(control.options).toEqual(options);
    expect(control.onAdd).toBeDefined();
    expect(control.onRemove).toBeDefined();
    expect(control.getDefaultPosition).toBeDefined();
    expect(control.getDefaultPosition()).toBe('bottom-right');
    expect(control.render).toBeDefined();
  });

  test('should set some properties onAdd', () => {
    const control = new CopyrightControl();
    const map = { on: () => {}, off: () => {} };
    control.onAdd(map);
    expect(control.container).toBeDefined();
    expect(control.map).toBe(map);
  });

  test('should remove some properties onRemove', () => {
    const control = new CopyrightControl();
    const map = { on: () => {}, off: () => {} };
    control.onAdd(map);
    const container = control.onRemove(map);
    expect(control.map).toBeUndefined();
    expect(control.container).toBe(container);
  });
});
