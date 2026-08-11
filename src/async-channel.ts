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
   * Put item onto Asynchronous Channel
   * @kind function
   * @name put
   */
  async put(item: T, ...debug: unknown[]): Promise<void> {
    this.debug && this.debug("put", item, ...debug);
    if (this.promise) {
      this.resolve?.(await this.transform(item));
    } else if (this.cache.length < this.limit) {
      this.cache.push(await this.transform(item));
    } else {
      throw new Error("cache full");
    }
  }
  /**
   * Take item off of Asynchronous Channel
   * @kind function
   * @name take
   */
  async take(...debug: unknown[]): Promise<T | typeof CHANNEL_END> {
    this.debug && this.debug("take", ...debug);
    if (this.cache.length) {
      return this.cache.shift() as T | typeof CHANNEL_END;
    } else {
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
