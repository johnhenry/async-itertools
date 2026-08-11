/**
 * Asynchronous Channel
 * @kind namespace
 * @name AsyncChannel
 */

/**
 * Constant signaling channel's end
 * @kind constant
 * @name CHANNEL_END
 */
export const CHANNEL_END: unique symbol = Symbol("CHANNEL_END");

interface InvertedPromiseParts<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
}

/**
 * Creates a promise that can be resolved/rejected outside of initial closure
 * @kind function
 * @name InvertedPromise
 * @ignore
 */
const InvertedPromise = <T>(): InvertedPromiseParts<T> => {
  const out = {} as InvertedPromiseParts<T>;
  out.promise = new Promise<T>((resolve, reject) => {
    out.resolve = resolve;
    out.reject = reject;
  });
  return out;
};

export interface AsyncChannelOptions<T> {
  cache?: Array<T | typeof CHANNEL_END | Error>;
  limit?: number;
  transform?: (item: T) => T | Promise<T>;
  debug?: (...args: unknown[]) => unknown;
}

/**
 * Asynchronous Channel class
 * @kind class
 * @name AsyncChannel
 */
export class AsyncChannel<T = unknown> {
  limit: number;
  cache: Array<T | typeof CHANNEL_END | Error>;
  transform: (item: T) => T | Promise<T>;
  debug?: (...args: unknown[]) => unknown;
  private promise?: Promise<T | typeof CHANNEL_END>;
  private resolve?: (value: T | typeof CHANNEL_END) => void;
  private reject?: (reason?: unknown) => void;
  /** Producers awaiting capacity, FIFO (backpressure -- see put()). */
  private putters: Array<{
    value: T | typeof CHANNEL_END | Error;
    release: () => void;
  }> = [];

  /**
   * Asynchronous Channel constructor
   * @kind function
   * @name constructor
   */
  constructor({
    cache = [],
    limit = Infinity,
    transform = ($: T) => $,
    debug,
  }: AsyncChannelOptions<T> = {}) {
    this.limit = limit;
    this.cache = cache.slice(0, limit);
    this.transform = transform;
    this.debug = debug;
  }
  /**
   * Move waiting producers' items into the cache while there is capacity,
   * releasing their pending put() promises (FIFO).
   * @ignore
   */
  private drainPutters(): void {
    while (this.putters.length > 0 && this.cache.length < this.limit) {
      const { value, release } = this.putters.shift() as {
        value: T | typeof CHANNEL_END | Error;
        release: () => void;
      };
      this.cache.push(value);
      release();
    }
  }
  /**
   * Put item onto Asynchronous Channel. Returns a Promise<void> that
   * resolves once the channel has accepted the item: immediately when a
   * taker is waiting or the cache has capacity, otherwise when a later
   * take() frees a slot (backpressure -- bounded by `limit`). Replaces the
   * pre-2.1 behavior of throwing "cache full" at capacity.
   * @kind function
   * @name put
   */
  async put(item: T, ...debug: unknown[]): Promise<void> {
    this.debug && this.debug("put", item, ...debug);
    const value = await this.transform(item);
    if (this.promise) {
      this.resolve?.(value);
      return;
    }
    if (this.cache.length < this.limit) {
      this.cache.push(value);
      return;
    }
    await new Promise<void>((release) => {
      this.putters.push({ value, release });
    });
  }
  /**
   * Take item off of Asynchronous Channel
   * @kind function
   * @name take
   */
  async take(...debug: unknown[]): Promise<T | typeof CHANNEL_END> {
    this.debug && this.debug("take", ...debug);
    if (this.cache.length) {
      const value = this.cache.shift() as T | typeof CHANNEL_END;
      this.drainPutters();
      return value;
    }
    if (this.putters.length) {
      // limit of 0 (rendezvous) or drained cache with waiting producers:
      // hand off directly.
      const { value, release } = this.putters.shift() as {
        value: T | typeof CHANNEL_END;
        release: () => void;
      };
      release();
      return value;
    }
    const { promise, resolve, reject } = InvertedPromise<
      T | typeof CHANNEL_END
    >();
    this.promise = promise;
    this.resolve = resolve;
    this.reject = reject;
    const value = await this.promise;
    delete this.promise;
    delete this.resolve;
    delete this.reject;
    return value;
  }
  /**
   * Pause Asynchronous Channel
   * @kind function
   * @name break
   */
  async break(...debug: unknown[]): Promise<void> {
    this.debug && this.debug("break", ...debug);
    if (this.promise) {
      await this.resolve?.(CHANNEL_END);
    } else if (this.putters.length > 0) {
      // Keep FIFO order: the end marker must not overtake producers
      // already waiting for capacity.
      this.putters.push({ value: CHANNEL_END, release: () => {} });
    } else {
      this.cache.push(CHANNEL_END);
    }
  }
  /**
   * Stop Asynchronous Channel
   * @kind function
   * @name throw
   */
  async throw(message?: string, ...debug: unknown[]): Promise<void> {
    this.debug && this.debug("throw", ...debug);
    if (this.promise) {
      await this.reject?.(new Error(message));
    } else if (this.putters.length > 0) {
      // Keep FIFO order behind producers already waiting for capacity.
      this.putters.push({ value: new Error(message), release: () => {} });
    } else {
      this.cache.push(new Error(message));
    }
  }
  /**
   * Return pending status of Asynchronous Channel
   * @kind function
   * @name pending
   * Note: should this be a getter?
   */
  pending(): boolean {
    return !!this.promise;
  }
  /**
   * Return string representation of Asynchronous Channel
   * @kind function
   * @name toString
   */
  toString(): string {
    return `AsyncChannel {${this.pending() ? "pending" : ""}} [${
      this.cache.length
    }/${this.limit}]`;
  }
  /**
   * Return Asynchronous Channel's iterator
   * @kind function
   * @name [Symbol.asyncIterator]
   */
  async *[Symbol.asyncIterator](...debug: unknown[]): AsyncGenerator<T> {
    while (true) {
      const answer = await this.take(...debug);
      if (answer === CHANNEL_END) {
        return;
      }
      yield answer;
    }
  }
}
