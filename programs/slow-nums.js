import { number, pause, transduceAsync, transducers, run} from '../dist/esm/index.js';
const { map } = transducers;
const slowDown= (milliseconds) => async n => {
    await pause(Math.random() * milliseconds);
    return n;
}
const program = transduceAsync(map(slowDown(250)))(
    number.iterateAsync(Infinity));
run(program).then(process.exit);
