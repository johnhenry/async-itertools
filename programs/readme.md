# Programming with asynchronous iterators

Asynchronous generator functions can be used to model any program that outputs data.

```javascript
const program = async function *() {
    yield 'hello';
    yield ' ';
    yield 'world';
}

(async ()=>{
    for await (const output of program()){
        console.log(output);
    }
    process.exit();
})();
```
Above, we iterate through the result of calling the program and log it's output.

For convenience, we provide a "run" method. By default, it renders directly to the console.

```javascript
import {run} from 'async-itertools';
//...
run(program()).then(process.exit);
```

Passing an AsyncChannel into an asynchronous generator function allows one to pass input into a generator function while it's running.

```javascript
import {run, AsyncChannel} from 'async-itertools';
const program = async function *(channel) {
    do{
        let name = await channel.take();
    }while(!name)
    yield `Hello ${name}!`;
}
const channel = new AsyncChannel();
globalThis.input = channel.put.bind(channel);
run(program(channel)).then(process.exit);
```

Following this pattern, we can create fully interactive text programs.

## Transforming


## Rendering

<!-- npm run node program-structure/programs/slow-nums.js -s | npm run node program-structure/programs/test.js -s -->
