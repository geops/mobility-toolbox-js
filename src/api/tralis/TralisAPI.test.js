import { TralisAPI, TralisModes } from '..';

describe('TralisAPI', () => {
  let tralisAPI;
  let get;

  beforeEach(() => {
    get = jest.fn((params, cb) => {
      cb({ content: 'content' });
    });
    tralisAPI = new TralisAPI();
    tralisAPI.wsApi = {
      get,
    };
  });

  describe('#getFullTrajectory() calls fullTrajectory channel', () => {
    test('without parameters', (done) => {
      tralisAPI.getFullTrajectory().then(() => {
        expect(get.mock.calls.length).toBe(1);
        expect(get.mock.calls[0][0]).toEqual({
          channel: 'full_trajectory',
        });
        done();
      });
    });

    [null, TralisModes.TOPOGRAPHIC].forEach((mode) => {
      describe(`using mode ${mode}`, () => {
        test('using id', (done) => {
          tralisAPI.getFullTrajectory('foo', mode).then(() => {
            expect(get.mock.calls.length).toBe(1);
            expect(get.mock.calls[0][0]).toEqual({
              channel: 'full_trajectory_foo',
            });
            done();
          });
        });

        test('using id and generalizationLevel param', (done) => {
          tralisAPI.getFullTrajectory('foo', mode, 5).then(() => {
            expect(get.mock.calls.length).toBe(1);
            expect(get.mock.calls[0][0]).toEqual({
              channel: 'full_trajectory_foo_gen5',
            });
            done();
          });
        });
      });
    });

    describe('using schematic mode ', () => {
      test('using id', (done) => {
        tralisAPI.getFullTrajectory('foo', TralisModes.SCHEMATIC).then(() => {
          expect(get.mock.calls.length).toBe(1);
          expect(get.mock.calls[0][0]).toEqual({
            channel: 'full_trajectory_schematic_foo',
          });
          done();
        });
      });
      test("doesn't use generalizationLevel param", (done) => {
        tralisAPI
          .getFullTrajectory('foo', TralisModes.SCHEMATIC, 10)
          .then(() => {
            expect(get.mock.calls.length).toBe(1);
            expect(get.mock.calls[0][0]).toEqual({
              channel: 'full_trajectory_schematic_foo',
            });
            done();
          });
      });
    });
  });
});
