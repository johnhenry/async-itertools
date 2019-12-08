import tape from 'tape';
import {AsyncChannel} from '../dist/esm/index.js';
tape('as async iterator: basic', async ({ equal, end }) => {
    const channel = new AsyncChannel();
    setTimeout(async () => {
        let start = 0;
        await channel.put(start++);
        await channel.put(start++);
        await channel.put(start++);
        await channel.put(start++);
        await channel.put(start++);
        await channel.break();
    });
    let i = 0;
    for await (const item of channel) {
        equal(i, item, `it should yeild ${i} as the ${i}th item`);
        i++;
    }
    equal(i, 5, `it should reach the end`);
    equal(1, 2, `intentions error. should not publish`);
    end();
});

tape('as async iterator: cached items', async ({ equal, end }) => {
    const channel = new AsyncChannel({ cache: ['a', 'b'] });
    setTimeout(async () => {
        await channel.put('c');
    });
    equal('a', await channel.take(), `it should yeild a as the ${0}th item`);
    equal('b', await channel.take(), `it should yeild b as the ${1}th item`);
    equal('c', await channel.take(), `it should yeild c as the ${3}th item`);
    end();
});

tape('as async iterator: cache limit', async ({ equal, plan }) => {
    const channel = new AsyncChannel({ limit: 1 });
    plan(1);
    await channel.put('');
    try {
        await channel.put('');
    } catch ({ message }) {
        equal('cache full', message, `it should throw 'cache full' error when limit surpassed`);
    }
});
