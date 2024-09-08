import type { LiteralValue } from "./expr-types";

export interface Callable {
  call(args: LiteralValue[]): LiteralValue;
}

export function isCallable(fn: any): fn is Callable {
  return fn && typeof fn === "object" && !("call" in fn);
}
