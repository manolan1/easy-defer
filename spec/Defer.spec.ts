
import Defer from '../src/Defer';

describe('Defer', () => {

    it('is constructed unsettled, unfulfilled, pending', () => {
        const d1 = new Defer();
        expect(d1).toBeTruthy();
        expect(d1.isPending).toBeTrue();
        expect(d1.isSettled).toBeFalse();
        expect(d1.isFulfilled).toBeFalse();
        expect(d1.isRejected).toBeFalse();
    });

    it('can be fulfilled with no value', async (done) => {
        const d1 = new Defer();
        d1.then(() => {
            expect(d1.isPending).toBeFalse();
            expect(d1.isSettled).toBeTrue();
            expect(d1.isFulfilled).toBeTrue();
            expect(d1.isRejected).toBeFalse();
            done();
        });
        d1.resolve();
    });

    it('can be fulfilled with a value', (done) => {
        const d1 = new Defer();
        d1.then(value => {
            expect(value).toBe('complete');
            expect(d1.isPending).toBeFalse();
            expect(d1.isSettled).toBeTrue();
            expect(d1.isFulfilled).toBeTrue();
            expect(d1.isRejected).toBeFalse();
            done();
        })
        d1.resolve('complete');
    });

    it('can be fulfilled with a value of any type', (done) => {
        const returnValue = { value: '' };
        const d1 = new Defer();
        d1.then(value => {
            expect(value).toBe(returnValue);
            done();
        })
        d1.resolve(returnValue);
    });

    it('can be rejected with no value', (done) => {
        const d1 = new Defer();
        d1.catch(() => {
            expect(d1.isPending).toBeFalse();
            expect(d1.isSettled).toBeTrue();
            expect(d1.isFulfilled).toBeFalse();
            expect(d1.isRejected).toBeTrue();
            done();
        });
        d1.reject();
    });

    it('can be rejected with a value', (done) => {
        const d1 = new Defer();
        d1.catch(err => {
            expect(err).toBe('an error');
            expect(d1.isPending).toBeFalse();
            expect(d1.isSettled).toBeTrue();
            expect(d1.isFulfilled).toBeFalse();
            expect(d1.isRejected).toBeTrue();
            done();
        });
        d1.reject('an error');
    });

    it('supports finally', (done) => {
        const d1 = new Defer();
        d1.finally(() => {
            done();
        })
        d1.resolve();
    });

    it('supports toString', () => {
        const d1 = new Defer();
        expect(d1.toString()).toEqual('[object Promise]');
    });

    it('can be typed', (done) => {
        const d1 = new Defer<string>();
        d1.then(value => {
            expect(value).toBe('complete');
            done();
        })
        d1.resolve('complete');
    });

});
