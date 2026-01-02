export type RequireOnly<T, K extends keyof T> = Required<Pick<T, K>> & Partial<Omit<T, K>>;
export type RequiredAndOptional<T, KR extends keyof T, KO extends keyof T> = Required<Pick<T, KR>> & Partial<Pick<T, KO>>;

type KeysWithNullish<T> = {
  [K in keyof T]-?: null extends T[K] ? K : undefined extends T[K] ? K : never;
}[keyof T];

type KeysWithoutNullish<T> = Exclude<keyof T, KeysWithNullish<T>>;

export type Clean<T> = T extends Function
  ? T
  : T extends Uint8Array<ArrayBufferLike>
    ? T
    : T extends ReadonlyArray<infer U>
      ? Array<Exclude<U, null | undefined>>
      : T extends object
        ? {
            [K in KeysWithoutNullish<T>]: T[K];
          } & {
            [K in KeysWithNullish<T>]?: Exclude<T[K], null | undefined>;
          }
        : Exclude<T, never>;

export type AtLeastOne<T, K extends keyof T = keyof T> =
  Partial<T> &
    {
      [P in K]-?: Required<Pick<T, P>> & Partial<Omit<Pick<T, K>, P>>;
    }[K];

