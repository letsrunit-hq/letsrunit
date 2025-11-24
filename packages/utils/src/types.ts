export type RequireOnly<T, K extends keyof T> = Required<Pick<T, K>> & Partial<Omit<T, K>>;

type KeysWithNullish<T> = {
  [K in keyof T]-?: null extends T[K] ? K : undefined extends T[K] ? K : never;
}[keyof T];

type KeysWithoutNullish<T> = Exclude<keyof T, KeysWithNullish<T>>;

export type Clean<T> = T extends Function
  ? T
  : T extends Uint8Array
    ? T
    : T extends ReadonlyArray<infer U>
      ? Array<Clean<U>>
      : T extends object
        ? {
            [K in KeysWithoutNullish<T>]: Clean<T[K]>;
          } & {
            [K in KeysWithNullish<T>]?: Clean<Exclude<T[K], null | undefined>>;
          }
        : Exclude<T, never>;
