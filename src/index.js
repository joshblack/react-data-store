import { makeCancellable } from './makeCancellable';

export default class DataStore {
  constructor({ resolve }) {
    /**
     * Let's leverage `resolve` for figuring out what URL to fetch.
     */
    this._resolve = resolve;

    /**
     * Maintain a simple Cache for storing our request information by a `url`
     * key, and the result as an object.
     *
     * TODO: implement a simple LRU mechanism so this doesn't grow boundlessly.
     */
    this._cache = new Map();

    /**
     * Maintain an identity cache for Component instances so that we can keep
     * track of Instance-specific pending requests, and subsequently cancel
     * them if the Instance unsubscribes on unmount.
     */
    this._wm = new WeakMap();
  }

  _fetch = (instance) => (...args) => new Promise((resolve, reject) => {
    const url = this._resolve(...args);

    if (this._cache.has(url)) {
      resolve(this._cache.get(url));
      return;
    }

    const request = makeCancellable(fetch(url));

    this._wm.set(instance, this._wm.get(instance).concat({ url, request }));

    request.promise
      .then((response) => response.json())
      .then((result) => {
        this._cache.set(url, result);
        this._filterInstanceByResolvedRequest(instance, url);

        resolve(result);
      })
      .catch((error) => {
        reject(error);
      });
  })

  /**
   * Filter a given `instance` by a `requestUrl`.
   *
   * This is useful when we have our pending requests stored as the value for an `instance` in our
   * WeakMap, but now that request has been resolved.
   *
   * Once that request has been resolved, we no longer need to keep track of it in our pending
   * requests for the given `instance`, so let's filter by the unique key for that request, in this
   * case its `url`, and update the `instance`'s WeakMap accordingly.
   *
   * @param {ReactComponentInstance} instance
   * @param {requestUrl} string
   * @return void
   */
  _filterInstanceByResolvedRequest = (instance, requestUrl) => {
    const requests = this._wm.get(instance)
      .filter(({ url }) => url !== requestUrl);

    this._wm.set(instance, requests);
  }

  /**
   * When we have a component subscribe, then we store that instance in our
   * internal WeakMap and return a wrapped version of `fetch` that is tied to
   * the specific instance.
   *
   * This wrapped version of `fetch` will allow us to save any pending requests,
   * and subsequently remove them when they are resolved. This also allows us to
   * cancel any pending requests if the Component is unmounted during a pending
   * request.
   *
   * @param {ReactComponentInstance} instance
   * @return void
   */
  subscribe(instance) {
    this._wm.set(instance, []);

    return this._fetch(instance);
  }

  /**
   * When we have a component unsubscribe, typically in componentWillUnmount, then go through each
   * of the pending requests for that component instance and cancel them. This will make sure that
   * we don't have any handlers being called on an unmounted Component Instance.
   *
   * @param {ReactComponentInstance} instance
   * @return void
   */
  unsubscribe(instance) {
    this._wm.get(instance).forEach(({ request }) => request.cancel());
    this._wm.delete(instance);
  }
}
