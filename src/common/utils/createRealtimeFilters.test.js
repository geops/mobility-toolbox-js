import createRealtimeFilters from './createRealtimeFilters';

const u1 = {
  properties: {
    route_identifier: '001.000827.004:7',
    operator: 'FoO',
    line: {
      name: 'U1',
    },
  },
};
const ireta = {
  properties: {
    routeIdentifier: '0022.000827.004:7',
    tenant: 'BAR',
    line: {
      name: 'IRETA',
    },
  },
};
const arb = {
  properties: {
    route_identifier: '00333.000827.004:7',
    operator: 'qux',
    line: {
      name: 'ARB',
    },
  },
};

const trajectories = [u1, ireta, arb];

describe('#createTrackerFilter()', () => {
  test('returns null', () => {
    const filterFunc = createRealtimeFilters();
    expect(filterFunc).toBe(null);
  });

  describe('using line', () => {
    test('as string', () => {
      const filterFunc = createRealtimeFilters('u1,foo');
      expect(trajectories.filter(filterFunc)).toEqual([u1]);
    });

    test('as array of string', () => {
      const filterFunc = createRealtimeFilters(['u1', 'foo', 'IRETA']);
      expect(trajectories.filter(filterFunc)).toEqual([u1, ireta]);
    });
  });

  describe('using route identifier (snake_case and camelCase (only tralis)', () => {
    test('as string', () => {
      const filterFunc = createRealtimeFilters(null, '1,foo');
      expect(trajectories.filter(filterFunc)).toEqual([u1]);
    });

    test('as array of string', () => {
      const filterFunc = createRealtimeFilters(null, ['22', 'foo', '1']);
      expect(trajectories.filter(filterFunc)).toEqual([u1, ireta]);
    });
  });

  describe('using operator', () => {
    test('as string (using operator deprecated property)', () => {
      const filterFunc = createRealtimeFilters(null, null, 'foo');
      expect(trajectories.filter(filterFunc)).toEqual([u1]);
    });

    test('as string (using tenant property)', () => {
      const filterFunc = createRealtimeFilters(null, null, 'bar');
      expect(trajectories.filter(filterFunc)).toEqual([ireta]);
    });

    test('as array of string', () => {
      const filterFunc = createRealtimeFilters(null, null, ['bar', 'foo', '1']);
      expect(trajectories.filter(filterFunc)).toEqual([u1, ireta]);
    });
  });

  describe('using regexLine', () => {
    test('as string', () => {
      const filterFunc = createRealtimeFilters(
        null,
        null,
        null,
        '^(S|R$|RE|PE|D|IRE|RB|TER)',
      );
      expect(trajectories.filter(filterFunc)).toEqual([ireta]);
    });

    test('as array of string', () => {
      const filterFunc = createRealtimeFilters(null, null, null, [
        '^IR',
        '^ARB$',
        'foo',
      ]);
      expect(trajectories.filter(filterFunc)).toEqual([ireta, arb]);
    });
  });
});
