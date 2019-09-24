export const CHANNEL_END = Symbol('CHANNEL_END');
const InvertedPromise = () => {
    const out = {};
    out.promise = new Promise((resolve, reject) => {
        out.resolve = resolve;
        out.reject = reject;
    });
    return out;
};
const defaults = () => ({ cache: [], limit: Infinity, transform: $ => $ });

export const AsyncChannel = class {
    constructor(
        { cache = [], limit = Infinity, transform = $ => $, debug} = defaults()) {
        this.limit = limit;
        this.cache = cache.slice(0, limit);
        this.transform = transform;
        this.debug = debug;
    }
    async put(item, ...debug) {
        this.debug && this.debug('put', item, ...debug);
        if (this.promise) {
            this.resolve(await this.transform(item));
        } else if (this.cache.length < this.limit) {
            this.cache.push(await this.transform(item));
        } else {
            throw new Error('cache full');
        }
    }
    async take(...debug) {
        this.debug && this.debug('take', ...debug);
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
    async break(...debug) {
        this.debug && this.debug('break', ...debug);
        if (this.promise) {
            await this.resolve(CHANNEL_END);
        } else {
            this.cache.push(CHANNEL_END);
        }
    }
    async throw(message, ...debug) {
        this.debug && this.debug('throw', ...debug);
        if (this.promise) {
            await this.reject(new Error(message));
        } else {
            this.cache.push(new Error(message));
        }
    }
    pending() {
        return !!this.promise;
    }
    toString() {
        return `AsyncChannel {${this.pending() ? 'pending' : ''}} [${this.cache.length}/${this.limit}]`;
    }
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
