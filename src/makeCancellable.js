/**
 * Given a promise, return the ability to `cancel` it by flipping a boolean so
 * that when the promise resolves it rejects with `isCancelled` set.
 *
 * @param {Promise} promise
 * @return {Object}
 */
export const makeCancellable = (promise) => {
  let hasCanceled = false;

  const wrappedPromise = new Promise((resolve, reject) => {
    promise
      .then((result) =>
        hasCanceled ? reject({ isCancelled: true }) : resolve(result)
      )
      .catch((error) =>
        hasCanceled ? reject({ isCancelled: true }) : reject(error)
      );
  });

  return {
    promise: wrappedPromise,
    cancel() {
      hasCanceled = true;
    },
  };
};
