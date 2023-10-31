import { RealtimeAPI, RealtimeModes } from '.';

describe('RealtimeAPI', () => {
  let api;
  let get;

  describe('using version 1', () => {
    beforeEach(() => {
      get = jest.fn((params, cb) => {
        cb({ content: 'content' });
      });
      api = new RealtimeAPI({ version: '1' });
      api.wsApi = {
        get,
      };
    });

    describe('#getFullTrajectory() calls fullTrajectory channel', () => {
      test('without parameters', (done) => {
        api.getFullTrajectory().then(() => {
          expect(get.mock.calls.length).toBe(1);
          expect(get.mock.calls[0][0]).toEqual({
            channel: 'full_trajectory',
          });
          done();
        });
      });

      [null, RealtimeModes.TOPOGRAPHIC].forEach((mode) => {
        describe(`using mode ${mode}`, () => {
          test('using id', (done) => {
            api.getFullTrajectory('foo', mode).then(() => {
              expect(get.mock.calls.length).toBe(1);
              expect(get.mock.calls[0][0]).toEqual({
                channel: 'full_trajectory_foo',
              });
              done();
            });
          });

          test('using id and generalizationLevel param', (done) => {
            api.getFullTrajectory('foo', mode, 5).then(() => {
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
          api.getFullTrajectory('foo', RealtimeModes.SCHEMATIC).then(() => {
            expect(get.mock.calls.length).toBe(1);
            expect(get.mock.calls[0][0]).toEqual({
              channel: 'full_trajectory_schematic_foo',
            });
            done();
          });
        });
        test("doesn't use generalizationLevel param", (done) => {
          api.getFullTrajectory('foo', RealtimeModes.SCHEMATIC, 10).then(() => {
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

  describe('using default verion (2)', () => {
    beforeEach(() => {
      get = jest.fn((params, cb) => {
        cb({ content: 'content' });
      });
      api = new RealtimeAPI();
      api.wsApi = {
        get,
      };
    });

    describe('#getFullTrajectory() calls fullTrajectory channel', () => {
      test('without parameters', (done) => {
        api.getFullTrajectory().then(() => {
          expect(get.mock.calls.length).toBe(1);
          expect(get.mock.calls[0][0]).toEqual({
            channel: 'full_trajectory',
          });
          done();
        });
      });

      [null, RealtimeModes.TOPOGRAPHIC].forEach((mode) => {
        describe(`using mode ${mode}`, () => {
          test('using id', (done) => {
            api.getFullTrajectory('foo', mode).then(() => {
              expect(get.mock.calls.length).toBe(1);
              expect(get.mock.calls[0][0]).toEqual({
                channel: 'full_trajectory_foo',
              });
              done();
            });
          });

          test('using id and generalizationLevel param', (done) => {
            api.getFullTrajectory('foo', mode, 5).then(() => {
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
          api.getFullTrajectory('foo', RealtimeModes.SCHEMATIC).then(() => {
            expect(get.mock.calls.length).toBe(1);
            expect(get.mock.calls[0][0]).toEqual({
              channel: 'full_trajectory_foo',
            });
            done();
          });
        });
        test("doesn't use generalizationLevel param", (done) => {
          api.getFullTrajectory('foo', RealtimeModes.SCHEMATIC, 10).then(() => {
            expect(get.mock.calls.length).toBe(1);
            expect(get.mock.calls[0][0]).toEqual({
              channel: 'full_trajectory_foo',
            });
            done();
          });
        });
      });
    });
  });
});
