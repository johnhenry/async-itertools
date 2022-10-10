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
export const CHANNEL_END = Symbol("CHANNEL_END");

/**
 * Creates a promise that can be resolved/rejected outside of initial closure
 * @kind function
 * @name InvertedPromise
 * @return {object}
 * @ignore
 */
const InvertedPromise = () => {
  const out = {};
  out.promise = new Promise((resolve, reject) => {
    out.resolve = resolve;
    out.reject = reject;
  });
  return out;
};

/**
 * Defaults for Asynchronous Channel
 * @kind function
 * @name defaults
 * @ignore
 */
const defaults = () => ({ cache: [], limit: Infinity, transform: ($) => $ });

/**
 * Asynchronous Channel class
 * @kind class
 * @name AsyncChannel
 */
export const AsyncChannel = class {
  /**
   * Asynchronous Channel constructor
   * @kind function
   * @name constructor
   */
  constructor(
    { cache = [], limit = Infinity, transform = ($) => $, debug } = defaults()
  ) {
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
  async put(item, ...debug) {
    this.debug && this.debug("put", item, ...debug);
    if (this.promise) {
      this.resolve(await this.transform(item));
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
  async take(...debug) {
    this.debug && this.debug("take", ...debug);
    if (this.cache.length) {
      return this.cache.shift();
    } else {
      const { promise, resolve, reject } = InvertedPromise();
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
  async break(...debug) {
    this.debug && this.debug("break", ...debug);
    if (this.promise) {
      await this.resolve(CHANNEL_END);
    } else {
      this.cache.push(CHANNEL_END);
    }
  }
  /**
   * Stop Asynchronous Channel
   * @kind function
   * @name throw
   */
  async throw(message, ...debug) {
    this.debug && this.debug("throw", ...debug);
    if (this.promise) {
      await this.reject(new Error(message));
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
  pending() {
    return !!this.promise;
  }
  /**
   * Return string representation of Asynchronous Channel
   * @kind function
   * @name toString
   */
  toString() {
    return `AsyncChannel {${this.pending() ? "pending" : ""}} [${
      this.cache.length
    }/${this.limit}]`;
  }
  /**
   * Return Asynchronous Channel's iterator
   * @kind function
   * @name [Symbol.asyncIterator]
   */
  async *[Symbol.asyncIterator](...debug) {
    while (true) {
      const answer = await this.take(...debug);
      if (answer === CHANNEL_END) {
        return;
      }
      yield answer;
    }
  }
};
