import { transduceAsync, transducers, channelDecorators, AsyncChannel, run } from '../dist/esm/index.js';

const genericProgram = async function* (channel) {
    yield await channel.take();
};

const { map } = transducers;
const { withEmitter } = channelDecorators;
const program = transduceAsync(map($ => $))(
    genericProgram(withEmitter(
        new AsyncChannel({ transform: buffer => buffer.toString().trim() }),
        process.stdin)));
run(program).then(process.exit);
