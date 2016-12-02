import DataStore from '../';

let ds;
let instance;
let _fetch;

jest.useFakeTimers();

describe('DataStore', () => {
  beforeEach(() => {
    ds = new DataStore({
      resolve: () => '/api/v1',
    });
    instance = {};
    _fetch = ds.subscribe(instance);

    window.fetch = jest.fn(() => new Promise((resolve) => {
      window.setTimeout(() => {
        resolve({
          json: () => new Promise((resolve) => resolve({
            foo: 'bar',
          })),
        });
      }, 1000);
    }));
  });

  it('should be initialized with a cache and instance map', () => {
    expect(ds._cache).toBeDefined();
    expect(ds._wm).toBeDefined();
  });

  describe('subscribe', () => {
    it('should allow consumers to subscribe and receive a `fetch` handler', () => {

      expect(_fetch).toBeDefined();
    });
  });

  describe('unsubscribe', () => {
    it('should call cancel on pending requests for an instance when unsubscribed', async () => {
      const request = _fetch({ path: '/foo' });

      ds.unsubscribe(instance);

      jest.runAllTimers();

      try {
        await request;
      } catch (error) {
        expect(error.isCancelled).toBe(true);
      }
    });
  });

  describe('_fetch', () => {
    it('should send a request for a url that hasn\'t been requested before and add it to the cache', async () => {
      const request = _fetch({ path: '/resource' });

      expect(ds._cache.size).toBe(0);

      jest.runAllTimers();

      const result = await request;

      expect(result).toBeDefined();
      expect(ds._cache.size).toBe(1);
    });

    it('should resolve from cache if the url has been fetched', async () => {
      const request1 = _fetch({ path: '/resource' });

      expect(ds._cache.size).toBe(0);

      jest.runAllTimers();

      await request1;
      const request2 = _fetch({ path: '/resource' });

      // We aren't running `jest.runAllTimers()`, yet our request will still resolve since we aren't
      // using `fetch` and are resolving from our internal cache
      const result2 = await request2;

      expect(result2).toBeDefined();
    });

    it('should remove resolved requests from the pending request queue for an instance', async () => {
      const request = _fetch({ path: '/resource' });

      // One pending request
      expect(ds._wm.get(instance).length).toBe(1);

      jest.runAllTimers();

      await request;

      // No pending requests
      expect(ds._wm.get(instance).length).toBe(0);
    });
  });
});
