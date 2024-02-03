import type { LiteralValue } from "./expr-types";
import { RuntimeError } from "./interpreter";
import type Token from "./token";

export default class Environment {
  values = new Map<string, LiteralValue>();

  define(name: string, value: LiteralValue) {
    this.values.set(name, value);
  }

  get(name: Token) {
    if (this.values.has(name.lexeme)) {
      return this.values.get(name.lexeme) as LiteralValue;
    }

    throw new RuntimeError(name, `Undefined variable ${name.lexeme}.`);
  }
}
