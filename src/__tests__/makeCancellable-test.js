import { makeCancellable } from '../makeCancellable';

let request;

describe('makeCancelable', () => {
  beforeEach(() => {
    request = jest.fn();

    request.mockReturnValueOnce(new Promise((resolve, reject) => {
      resolve(true);
    }));
  });

  it('should resolve if not cancelled', async () => {
    const result = await request();

    expect(result).toBe(true);
  });

  it('should throw an error if cancelled with `isCancelled` set', async () => {
    const cancellable = makeCancellable(request());

    cancellable.cancel();

    try {
      await cancellable.promise;
    } catch (error) {
      expect(error.isCancelled).toBe(true);
    }
  });

  it('should throw if there is an error', async () => {
    const request = jest.fn();

    request.mockReturnValueOnce(new Promise((resolve, reject) => {
      reject(true);
    }));

    const cancellable = makeCancellable(request());

    try {
      await cancellable.promise;
    } catch (error) {
      expect(error).toBe(true);
    }
  });
});
