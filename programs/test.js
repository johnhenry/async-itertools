import { AsyncChannel, transduceAsync, transducers, channelDecorators, run } from '../dist/esm/index.js';
const transform = buffer => buffer.toString().trim();
const { map, take, group, accumulate } = transducers;
const { withEmitter } = channelDecorators;
const transduce = transduceAsync(
    map(item => parseInt(item)),
    accumulate(),
    map(item => `Result: ${item}`),
);
const program = transduce(withEmitter(new AsyncChannel({ transform }), process.stdin));
run(program).then(process.exit);
