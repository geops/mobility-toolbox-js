import Control from './Control';

describe('Control', () => {
  test('should be activated by default', () => {
    const control = new Control();
    expect(control.active).toBe(true);
  });

  test('should not be activated if set to false in the options', () => {
    const control = new Control({ active: false });
    expect(control.active).toBe(false);
  });

  test('should call activate/deactivate when active is set to true/false', () => {
    const control = new Control();
    const spy1 = jest.spyOn(control, 'activate');
    const spy2 = jest.spyOn(control, 'deactivate');
    const spy3 = jest.spyOn(control, 'render');
    control.active = false;
    expect(spy1).toBeCalledTimes(0);
    expect(spy2).toBeCalledTimes(1);
    expect(spy3).toBeCalledTimes(1);
    control.active = true;
    expect(spy1).toBeCalledTimes(1);
    expect(spy2).toBeCalledTimes(2);
    expect(spy3).toBeCalledTimes(2);
  });

  test('should append/remove the element to the map container when map is set', () => {
    const element = document.createElement('div');
    const target = document.createElement('div');
    const control = new Control({
      element,
    });
    const spy1 = jest.spyOn(control, 'activate');
    const spy2 = jest.spyOn(control, 'deactivate');
    const spy3 = jest.spyOn(control, 'render');
    control.map = {
      getContainer() {
        return target;
      },
    };
    expect(target.childNodes[0]).toBe(element);
    expect(spy1).toBeCalledTimes(1);
    expect(spy2).toBeCalledTimes(2);
    expect(spy3).toBeCalledTimes(1);

    control.detachFromMap();
    expect(target.childNodes[0]).toBe();
    expect(spy1).toBeCalledTimes(1);
    expect(spy2).toBeCalledTimes(3);
    expect(spy3).toBeCalledTimes(2);
  });

  test('should append/remove the element to the target property when map is set', () => {
    const element = document.createElement('div');
    const target = document.createElement('div');
    const control = new Control({
      target,
      element,
    });
    const spy1 = jest.spyOn(control, 'activate');
    const spy2 = jest.spyOn(control, 'deactivate');
    const spy3 = jest.spyOn(control, 'render');
    control.map = {};
    expect(target.childNodes[0]).toBe(element);
    expect(spy1).toBeCalledTimes(1);
    expect(spy2).toBeCalledTimes(2);
    expect(spy3).toBeCalledTimes(1);

    control.detachFromMap();
    expect(target.childNodes[0]).toBe();
    expect(spy1).toBeCalledTimes(1);
    expect(spy2).toBeCalledTimes(3);
    expect(spy3).toBeCalledTimes(2);
  });

  test('set a custom render method', () => {
    const spy = jest.fn();
    // eslint-disable-next-line no-unused-vars
    const control = new Control({
      render: spy,
    });
    expect(spy).toBeCalledTimes(1);
  });

  test('pass function params to custom render method', () => {
    const spy = jest.fn();
    // eslint-disable-next-line no-unused-vars
    const control = new Control({
      render: spy,
    });
    control.render('foo', 'bar');
    expect(spy).toBeCalledTimes(2);
    expect(spy.mock.calls[1][0]).toBe('foo');
    expect(spy.mock.calls[1][1]).toBe('bar');
  });
});
