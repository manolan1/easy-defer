
// Wherever there is an any in this class, it comes from the official Typescript definition!

/* eslint-disable @typescript-eslint/no-explicit-any */
export default class Defer<T> implements Promise<T> {
    get [Symbol.toStringTag](): string {
        return 'Promise';
    }

    private fulfilled = false;
    private rejected = false;
    private promise: Promise<T>;

    private resolver?: (value?: T | PromiseLike<T>) => void;
    private rejecter?: (reason?: any) => void;

    // This is really rather unnecessary as they will always be defined, but it permits 
    // both TS and ESLint to be happy at the same time, can't help the coverage impact!
    resolve(value?: T | PromiseLike<T>): void {
        this.resolver?.(value);
    }

    // This is the actual Typescript declaration, so it requires any
    /* eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types */
    reject(reason?: any): void {
        this.rejecter?.(reason);
    }

    then: <TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null) => Promise<TResult1 | TResult2>;
    catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null) => Promise<T | TResult>;
    finally: (onfinally?: (() => void) | undefined | null) => Promise<T>;

    constructor() {
        this.promise = new Promise<T>((resolve, reject) => {
            this.resolver = resolve;
            this.rejecter = reject;
        })
            .then(
                (value: any) => {
                    this.fulfilled = true;
                    return value;
                },
                (err: any) => {
                    this.rejected = true;
                    throw err;
                });
        this.catch = this.promise.catch.bind(this.promise);
        this.finally = this.promise.finally.bind(this.promise);
        this.then = this.promise.then.bind(this.promise);
    }

    get isFulfilled(): boolean {
        return this.fulfilled;
    }

    get isRejected(): boolean {
        return this.rejected;
    }

    get isSettled(): boolean {
        return this.fulfilled || this.rejected;
    }

    get isPending(): boolean {
        return !this.isSettled;
    }

}
