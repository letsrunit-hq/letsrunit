export type MaybePromise<T> = Promise<T> | T;
export type MaybeAsync<F extends (...args: any[]) => any> =
  (this: ThisParameterType<F>, ...args: Parameters<F>) =>
    ReturnType<F> extends Promise<infer R> ? Promise<R> : ReturnType<F> | Promise<ReturnType<F>>;

export type JSONValue = string | number | boolean | null | JSONValue[] | { [key: string]: JSONValue | undefined };
