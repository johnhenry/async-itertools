# Async-itertools

This module implements a number of asynchronous iterator building blocks inspired by constructs from [Python](https://docs.python.org/3/library/itertools.html), APL, Haskell, and SML. Each has been recast in a form suitable for JavaScript.

The module standardizes a core set of fast, memory efficient tools that are useful by themselves or in combination. Together, they form an “iterator algebra” making it possible to construct specialized tools succinctly and efficiently in pure JavaScript.

## Installation

```bash
npm install async-itertools
```

## Usage

AsyncItertools is built in three different module flavors:

### IFFE ('script src=')

The traditional way to load javascript in browsers.

```html
<html>
    <script src='./node_modules/async-itertools/dist/asyncItertools.js'></script>
    <script>
        // do stuff with asyncItertools
    </script>
</html>
```

### Common JS ('require')

The traditional way to load javascript in node.

```javascript
const asyncItertools = require('./node_modules/async-itertools/dist/cjs/index.cjs');
// do stuff with asyncItertools
```

### Ecmascript modules ('import')

The modern way to load javascript in browsers and node.

```html
<html>
    <script type='module'>
        import * as asyncItertools from './node_modules/async-itertools/dist/index.js';
        // do stuff with asyncItertools
    </script>
</html>
```

```javascript
// import * as asyncItertools from './node_modules/async-itertools/dist/index.js';
import * as asyncItertools from 'async-itertools';
// do stuff with asyncItertools
```

## Writing Programs with Asynchronous Iterators

## Transforming data with Asynchronous Transducers

### Creating your own transducers

## Synchronous Counterparts

## Helpers

### Pause

## API

### Table of contents

- [namespace AsyncChannel](#namespace-asyncchannel)
- [namespace transducerReturners](#namespace-transducerreturners)
- [class AsyncChannel](#class-asyncchannel)
- [function break](#function-break)
- [function concatAsync](#function-concatasync)
- [function concatSync](#function-concatsync)
- [function conjoinAsync](#function-conjoinasync)
- [function conjoinSync](#function-conjoinsync)
- [function constructor](#function-constructor)
- [function emptySync](#function-emptysync)
- [function emptySync](#function-emptysync-1)
- [function filter](#function-filter)
- [function group](#function-group)
- [function iterateAsync](#function-iterateasync)
- [function iterateSync](#function-iteratesync)
- [function map](#function-map)
- [function put](#function-put)
- [function put](#function-put-1)
- [function reduce](#function-reduce)
- [function reduce](#function-reduce-1)
- [function reduceAsync](#function-reduceasync)
- [function run](#function-run)
- [function take](#function-take)
- [function take](#function-take-1)
- [function teeAsync](#function-teeasync)
- [function throw](#function-throw)
- [function toString](#function-tostring)
- [function transduceAsync](#function-transduceasync)
- [function transduceSync](#function-transducesync)
- [function withEmitter](#function-withemitter)
- [function withWebSocket](#function-withwebsocket)
- [function zipSync](#function-zipsync)
- [constant CHANNEL_END](#constant-channel_end)

### namespace AsyncChannel

Asynchronous Channel

* * *

### namespace transducerReturners

Functions that return transducers

#### See

- transduceSync
- transduceAsync

* * *

### class AsyncChannel

Asynchronous Channel class

* * *

### function break

Pause Asynchronous Channel

* * *

### function concatAsync

Concatinates sequence of asynchronous iterables

| Parameter   | Type      | Description |
| :---------- | :-------- | :---------- |
| `iterators` | iterators | iterators   |

**Returns:** iterator generating sequence of combined from given iterables; empty iterator if nothing is passed

* * *

### function concatSync

Concatinates sequence of synchronous iterables

| Parameter   | Type      | Description |
| :---------- | :-------- | :---------- |
| `iterators` | iterators | iterators   |

**Returns:** iterator generating sequence of combined from given iterables; empty iterator if nothing is passed

* * *

### function conjoinAsync

Appends items to asynchronous iterator

| Parameter  | Type     | Description          |
| :--------- | :------- | :------------------- |
| `iterator` | iterator | iterator             |
| `itemList` | itemList | items to be appended |

**Returns:** copy of initial iterator with items appended

* * *

### function conjoinSync

Appends items to synchronous iterator

| Parameter  | Type     | Description          |
| :--------- | :------- | :------------------- |
| `iterator` | iterator | iterator             |
| `itemList` | itemList | items to be appended |

**Returns:** copy of initial iterator with items appended

* * *

### function constructor

Asynchronous Channel constructor

* * *

### function emptySync

"The" Empty Iterator
 Immediately finishes and yields nothing.

* * *

### function emptySync

"The" Empty Asynchronous Iterator
 Immediately finishes and yields nothing.

* * *

### function filter

Create a transducer that filters values

| Parameter   | Type     | Description                                         |
| :---------- | :------- | :-------------------------------------------------- |
| `predicate` | function | boolean function to determine if an item is emitted |

**Returns:** transducer

* * *

### function group

Create a transducer that groups items by quantity before emitting.
Note: this currently returns arrays -- would sets make more sense?

| Parameter | Type   | Description   |
| :-------- | :----- | :------------ |
| `limit`   | number | size of group |

**Returns:** transducer

* * *

### function iterateAsync

Create an asynchronous sequence of numbers

| Parameter   | Type   | Description                           |
| :---------- | :----- | :------------------------------------ |
| `min`       | number | number at which to start iteration    |
| `max`       | number | number before which to stop iteration |
| `increment` | number | increment                             |

#### See

- iterateSync

#### Examples

_Log an infinite sequence of numbers starting with 5_

> ```javascript
> import { number } from '...';
> for await(const num of number.iterateAsync(5)){
> console.log(num);
> }
> ```

* * *

### function iterateSync

Create a sequence of numbers

| Parameter   | Type   | Description                           |
| :---------- | :----- | :------------------------------------ |
| `min`       | number | number at which to start iteration    |
| `max`       | number | number before which to stop iteration |
| `increment` | number | increment                             |

#### See

- iterateAsync

#### Examples

_Log an infinite sequence of numbers starting with 5_

> ```javascript
> import { number } from '...';
> for(const num of number.iterateSync(5)){
> console.log(num);
> }
> ```

* * *

### function map

Create a transducer that maps values

| Parameter   | Type     | Description                                  |
| :---------- | :------- | :------------------------------------------- |
| `transform` | function | transformation function applied to each item |

**Returns:** transducer

* * *

### function put

Put item onto Asynchronous Channel

* * *

### function put

Take item off of Asynchronous Channel

* * *

### function reduce

Create a promise that fulfills after a given number of milliseconds
The primary purpose of this is to allow pausing of asynchronous functions

| Parameter      | Type   | Description                                  |
| :------------- | :----- | :------------------------------------------- |
| `milliseconds` | number | time in milliseconds befor value is resolved |
| `value`        | \*     | value given                                  |

**Returns:** Promise fulfilled with given value

#### Examples

_Pause a function for 5000 milliseconds_

> ```javascript
> import { pause } from '...';
> (async ()=>{
>  console.log('hello');
>  await pause(5000);
>  console.log('there.');
> })();
> ```

* * *

### function reduce

Reduce function for iterators -- appends items to iterator

| Parameter      | Type     | Description                        |
| :------------- | :------- | :--------------------------------- |
| `iterator`     | iterator | iterator                           |
| `reduce`       | function | reducer function                   |
| `init`         | \*       | initial reduce value               |
| `ignore_hault` | boolean  | =false ignore when hault is passed |

**Returns:** iterator if no items are passed; empty iterator if nothing is passed

* * *

### function reduceAsync

Reduce function for asynchronous iterators -- appends items to asynchronous iterator

| Parameter      | Type     | Description                 |
| :------------- | :------- | :-------------------------- |
| `iterator`     | iterator | iterator                    |
| `reduce`       | function | reducer function            |
| `init`         | \*       | initial reduce value        |
| `ignore_hault` | boolean  | ignore when hault is passed |

**Returns:** iterator if no items are passed; empty iterator if nothing is passed

* * *

### function run

"run" iterator as a program

| Parameter | Type     | Description                             |
| :-------- | :------- | :-------------------------------------- |
| `program` | iterator | iterator                                |
| `render`  | render   | function to render output from iterator |

* * *

### function take

Create a transducer that halts after a given number of values

| Parameter | Type   | Description                 |
| :-------- | :----- | :-------------------------- |
| `limit`   | number | maximum total items to emit |

**Returns:** transducer

* * *

### function take

Create a transducer that accumulates items into a result and emits them
Similar to #Array.reduce

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `func`    | function | accumulation function      |
| `initial` | \*       | initial accumulation value |

**Returns:** transducer

* * *

### function teeAsync

Create a function that tees a emitted items to n iterators
Note: This may actually not work due to iterators being "pull" streams

| Parameter | Type   | Description                |
| :-------- | :----- | :------------------------- |
| `num`     | number | number iterators to create |

**Returns:** function

#### Examples

_Split an iterator into 4_

> ```javascript
> import { teeAsync, number } from '...';
> const streams = teeAsync(4)(number)
> for await (const num of streams[0]){
>   console.info(num);
> };
> for await (const num of streams[1]){
>   console.log(num);
> };
> for await (const num of streams[2]){
>   console.warn(num);
> };
> for await (const num of streams[3]){
>   console.error(num);
> };
> const LIMIT = 2 ** 2;
> const transduce = transduceAsync(
>     filter(x => x % 2),
>     map(x => x + 1),
>     take(LIMIT),
> );
> for await (const result of transduce(iterateAsync(Infinity))) {
>   console.log(result);
> }
> ```

* * *

### function throw

Stop Asynchronous Channel

* * *

### function toString

Return string representation of Asynchronous Channel

* * *

### function transduceAsync

Create a function that transduces an asynchronous iterator from a list of transducer function

| Parameter     | Type                 | Description         |
| :------------ | :------------------- | :------------------ |
| `transducers` | …Array&lt;functions> | list of transducers |

#### See

- transducers
- transduceSync

#### Examples

_Asynchronously log transduced numbers_

> ```javascript
> import { transduceAsync, transducers, number } from '...';
> const {iterateAsync} = number;
> const {
>     map,
>     filter,
>     take,
> } = transducers;
> const LIMIT = 2 ** 2;
> const transduce = transduceAsync(
>     filter(x => x % 2),
>     map(x => x + 1),
>     take(LIMIT),
> );
> for await (const result of transduce(iterateAsync(Infinity))) {
>   console.log(result);
> }
> ```

* * *

### function transduceSync

Create a function that transduces a synchronous iterator from a list of transducer function

| Parameter     | Type                 | Description         |
| :------------ | :------------------- | :------------------ |
| `transducers` | …Array&lt;functions> | list of transducers |

#### See

- transducers
- transduceAsync

#### Examples

_Synchronously log transduced numbers_

> ```javascript
> import { transduceSync, transducers, number } from '...';
> const {iterateSync} = number;
> const {
>     map,
>     filter,
>     take,
> } = transducers;
> const LIMIT = 2 ** 2;
> const transduce = transduceSync(
>     filter(x => x % 2),
>     map(x => x + 1),
>     take(LIMIT),
> );
> for await (const result of transduce(iterateSync(Infinity))) {
>   console.log(result);
> }
> ```

* * *

### function withEmitter

Decorate Asynchronous Channel with generic emitter

* * *

### function withWebSocket

Decorate Asynchronous Channel with websocket

* * *

### function zipSync

Zips synchronous iterators

| Parameter   | Type         | Description |
| :---------- | :----------- | :---------- |
| `iterators` | iteratorList | iterators   |

**Returns:** an iterator who's members are the members of the given iterators zipped sequencially

* * *

### constant CHANNEL_END

Constant signaling channel's end
## Todo

## Iterator vs Iterable
Clarify difference between "iterables", which have a next method, and "iterators", which produce iterables
via the [Symbol.iterable] method.

Note: 
```javascript
const a = function *(){};
a();
a()[Symbol.iterator]()
```
### "next" function 
```javascript
const next = (iterator)=>{
    const {value, done};
    if(done){
        throw new Error('iterator exhausted');
    }
    return value;
}
try{
    const val0 = await next(iterator);
    const val2 = await next(iterator);
    const val3 = await next(iterator);
}catch{
    throw new Error('iterator had less than 3 values');
}
```

### "extractIterator" function 
```javascript
const extractIterator = iterable=>iterable[Sumbol.iterator];
const a = extractIterator([1,2,3]);
next(a);//1
next(a);//2
next(a);//3
next(a);// throws error
```
