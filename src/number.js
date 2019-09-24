export const iterateSync = function* (min = 0, max, inc = 1) {
    if (max === undefined) {
        if (min < 0) {
            max = 0;
            // max = typeof min === 'bigint' ? 0n : 0;
        } else {
            max = min;
            min = 0;
            // min = typeof min === 'bigint' ? 0n : 0;
        }
    }
    // if (typeof min === 'bigint') {
    //     inc = BigInt(inc);
    // }
    if (min > max) {
        while (min > max) {
            yield min -=inc;
        }
        return;
    }
    while (min < max) {
        yield min +=inc;
    }
    return;

};
export const iterateAsync = async function* (min = 0, max, inc = 1) {
    yield* iterateSync(min, max, inc);
};