[↑](../readme.md)

# Todo

## Iterator vs Iterable

Clarify difference between "iterables", which have a next method, and "iterators", which produce iterables
via the [Symbol.iterable] method.

Note:

```javascript
const a = function* () {};
a();
a()[Symbol.iterator]();
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
const extractIterator = (iterable) => iterable[Sumbol.iterator];
const a = extractIterator([1, 2, 3]);
next(a); //1
next(a); //2
next(a); //3
next(a); // throws error
```
