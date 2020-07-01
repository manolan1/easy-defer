
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

    /*
     * This is a bit of a compromise due to limitations in Typescript's static checking.
     *
     * We "know" that resolver and rejecter will never be null. They are initialised in
     * the constructor, but in such a way that Typescript cannot tell that definitively.
     * 
     * The choices are:
     * - Use resolver and rejecter directly outside the class.
     * 
     *   This is the JS solution and would be absolutely fine if JS were the only language 
     *   supported, but TS complains, so every usage needs an non-null assertion or an 
     *   optional call.
     * 
     *   Instead, we create the function resolve and reject to expose them and hide the
     *   handling of the "impossible" null scenario.
     * 
     * - Initialise the fields to empty functions or arrow functions, i.e. () => { }
     * 
     *   This resolves the optionality, but it introduces two issues. First, ESLint
     *   complains with an Error that such functions are not allowed. Second, it impacts
     *   the code coverage (for Functions) since those empty functions cannot be executed.
     * 
     * - Use optional call, i.e. this.resolver?.(value)
     * 
     *   This also resolves the optionality. ESLint is completely happy. However, the code
     *   coverage is incorrect because this introduces two implied branches, which can never
     *   be executed.
     *
     * - Assert that the fields are non-null.
     * 
     *   This is the chosen solution. It resolves the optionality and gives the correct code
     *   coverage statistics. It requires an override to the default ESLint rules which warn 
     *   against non-null assertions. But at least it is a warning rather than an Error (so
     *   the rule authors have decided it is a lesser sin). 
     */

    resolve(value?: T | PromiseLike<T>): void {
        /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
        this.resolver!(value);
    }

    // This is the actual Typescript declaration, so it requires any
    /* eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types */
    reject(reason?: any): void {
        /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
        this.rejecter!(reason);
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
