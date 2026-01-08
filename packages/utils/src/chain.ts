/**
 * Chain of responsibility.
 * Each function returns true if handled or false if not
 */
export function chain<A extends readonly unknown[]>(...steps: ReadonlyArray<(...args: A) => boolean | Promise<boolean>>) {
  return async (...args: A): Promise<boolean> => {
    for (const step of steps) {
      if (await step(...args)) return true;
    }
    return false;
  };
}
