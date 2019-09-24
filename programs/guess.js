import { transduceAsync, transducers, AsyncChannel, run, channelDecorators } from '../dist/esm/index.js';

const guess = async function* (channel, min = 0, max = 9, players = 2) {
    const target = Math.floor(Math.random() * (max - min)) + min;
    let turn = -1;
    let guess;
    const win = true, lose = true;
    here:
    do {
        if (min === max) {
            return yield { turn, players, target, lose };
        }
        turn++;
        yield { turn, players, min, max };
        guess = await channel.take();
        if (guess > target) {
            max = Math.min(guess - 1, max);
        }
        if (guess < target) {
            min = Math.max(guess + 1, min);
        }
    } while (target !== guess);
    return yield { turn, players, target, win };
}
const outputMap = ({ win, lose, turn, players, min, max, target }) => {
    if (win) {
        return `Player ${turn % players} wins with ${target}!`;
    } else if (lose) {
        return `Player ${turn % players} loses by failing to guess ${target}.`;
    } else {
        return `Player ${turn % players}, guess a number between ${min} and ${max}`;
    }
};

const { map } = transducers;
const { withEmitter } = channelDecorators;
const program = transduceAsync(map(outputMap))(
    guess(
        withEmitter(
            new AsyncChannel({transform: buffer => Number(buffer.toString())}),
            process.stdin)));
run(program).then(process.exit);
