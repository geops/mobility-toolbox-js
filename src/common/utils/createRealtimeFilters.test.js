import createRealtimeFilters from './createRealtimeFilters';

const u1 = {
  properties: {
    line: {
      name: 'U1',
    },
    operator: 'FoO',
    route_identifier: '001.000827.004:7',
  },
};
const ireta = {
  properties: {
    line: {
      name: 'IRETA',
    },
    route_identifier: '0022.000827.004:7',
    tenant: 'BAR',
  },
};
const arb = {
  properties: {
    line: {
      name: 'ARB',
    },
    operator: 'qux',
    route_identifier: '00333.000827.004:7',
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
