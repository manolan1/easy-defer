# easy-defer

[![Build Status](https://travis-ci.org/manolan1/easy-defer.svg?branch=master)](https://travis-ci.org/manolan1/easy-defer)
[![Dependency Status](https://david-dm.org/manolan1/easy-defer.svg)](https://david-dm.org/manolan1/easy-defer)
[![Code Coverage](https://codecov.io/gh/manolan1/easy-defer/branch/master/graph/badge.svg)](https://codecov.io/gh/manolan1/easy-defer)

A simple promise-based defer and synchronisation mechanism

The `Defer` class is basically a `Promise` that makes `resolve()`, `reject()` and the state available externally.


# Basic Usage

```js
const Defer = require('easy-defer').default;

const d1 = new Defer();
d1.then(() => console.log('d1 completed'));

// elsewhere
d1.resolve();
```


# API

## Importing

Note that when importing using commonjs `require`, you must specify `.default`:
```js
const Defer = require('easy-defer').default;
```

You may also use import:
```js
import Defer from '../src/Defer';
```


## The `Defer` Class

### Properties

As with `Promise`, `Defer` can be in [one of three states][1], but unlike `Promise`, those states can be observed externally:
* `isFulfilled` - completed successfully (`resolve()` was called)
* `isPending` - not completed either way (inverse of `isSettled`)
* `isRejected` - completed unsuccessfully (`reject()` was called)
* `isSettled` - completed either successfully or unsucessfully

[1]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise

### Methods

Most of the methods are exactly the same as in [`Promise`][1], with the exception that `resolve()` and `reject()` would not normally be available externally. All the parameters are optional.

#### `catch(onRejected)`
Defines a function to be called if the `Defer` is rejected. `onRejected` receives one parameter, `reason`, which is whatever was passed to `reject()`.

#### `finally(onFinally)`
Defines a function to be called when the `Defer` settles, regardless of whether it is resolved or rejected. `onFinally` receives no parameters.

#### `reject(reason)`
Causes the `Defer` to settle in the rejected state.

#### `resolve(value)`
Causes the `Defer` to settle in the fulfilled state.

#### `then(onFulfilled[, onRejected])`
Defines function(s) to be called when the `Defer` settles. `onFulfilled` is called if the `Defer` was resolved, it receives a parameter of the fulfillment value (whatever was passed to `resolve()`). `onRejected` is equivalent to using `catch()`.

#### `toString()`
Behaves exactly like `Promise`, returning the string `'Promise'`.


# Advanced Usage

The `Defer` object is a `Promise` so it can take part in Promise-like activities.

To check whether a series of events have occurred:
```js
const d2 = new Defer();
const d3 = new Defer();
Promise.all([d2, d3])
    .then(() => console.log('d2, d3 complete'))
    .catch((err) => console.log(err));

// elsewhere
d2.resolve();

// another place
d3.resolve();
```

Given the primary use cases, the promises will generally be fulfilled. The `reject()` method is included for completeness and to allow error propagation:
```js
const d4 = new Defer();
const d5 = new Defer();
Promise.all([d4, d5])
    .then(() => console.log('d4, d5 complete'))
    .catch((err) => console.log(err));

// elsewhere
d4.resolve();

// another place
d5.reject('d5 did not work');
```


# Examples

## Testing `EventEmitter`

The original use case for `Defer` was testing an `EventEmitter` as a black box.

Tests sometimes need to check that several events have been emitted. Usually we try to constrain what happens using mock dependencies, but that is not always possible (or desirable). By creating several `Defer` objects and using `resolve()` in each event handler, we can check when all the events have been triggered, regardless of sequence.

In this, clearly contrived, example, we want to check that `SomeEmitter` emits both `event1` and `event2`, but we cannot guarantee the order.

```js

const EventEmitter = require('events');
const Defer = require('easy-defer').default;

class SomeEmitter extends EventEmitter {

    start() {
        // guarantee asynchronous
        process.nextTick(this.send.bind(this));
    }

    send() {
        const args = [];
        if (Math.random() < 0.5) {
            this.emit('event1', args);
            this.emit('event2', args);
        } else {
            this.emit('event2', args);
            this.emit('event1', args);
        }
    }
}

describe('SomeEmitter', () => {

    it('emits multiple events', (done) => {
        const d1 = new Defer();
        const d2 = new Defer();

        const em = new SomeEmitter()
            .on('event1', (args) => {
                // expectations on args

                d1.resolve();
            })
            .on('event2', (args) => {
                // expectations on args

                d2.resolve();
            });

        Promise.all([d1, d2])
            .then(() => done());

        em.start();
    });
});
```


## Separate Arrange from Act

Imagine the case where we have a download manager that implements some sort of throttling. We need to see whether it really throttles requests. There are a number of ways to approach this, but one way would be to use some `Defer` objects.

Here, the use of `Defer` allows us to configure all the requests without worrying that one of them will complete before we are ready.

```js
    it('throttles downloads', async (done) => {
        const d1 = new Defer();
        const d2 = new Defer();

        nock('https://test.com')
            .get('/test1')
            .reply(200, async (_uri, _requestBody) => {
                await d1;           // this response will wait until we are ready
                return RESPONSE;
            });

        nock('https://test.com')
            .get('/test2')
            .reply(200, async (_uri, _requestBody) => {
                await d2;           // this response will wait until we are ready
                return RESPONSE;
            });

        nock('https://test.com')
            .get('/test3')
            .reply(200, (_uri, _requestBody) => {
                return RESPONSE;    // this response will not wait
            });

        const dm = new DownloadManager();
        const p1 = dm.downloadUrl('https://test.com/test1');
        const p2 = dm.downloadUrl('https://test.com/test2');
        const p3 = dm.downloadUrl('https://test.com/test3')
            .then(() => {
                // expect to be called after d2 has completed, but d1 is still waiting
                expect(d1.isPending).toBeTrue();
                expect(d2.isFulfilled).toBeTrue();
                 // resolve the last of them so all the downloads complete
                d1.resolve();
            });

        // Once all the promises are complete, we'll end the test
        Promise.all([p1, p2, p3])
            .then(() => done());

        // Guard conditions - everything is waiting
        expect(d1.isPending).toBeTrue();
        expect(d2.isPending).toBeTrue();

        // Completing one request should allow the third request to be serviced
        d2.resolve();
    });
```

In this test, if the download for `p3` is not being throttled, it will start and finish immediately on declaration. The state of `d2` will not match what is expected.
