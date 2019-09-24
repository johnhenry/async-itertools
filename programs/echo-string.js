import { AsyncChannel, channelDecorators, run } from '../dist/esm/index.js';

const { withEmitter } = channelDecorators;
const program = withEmitter(
    new AsyncChannel({
        transform: buffer => buffer.toString().trim()
    }), process.stdin);
run(program, console.error).then(process.exit);
