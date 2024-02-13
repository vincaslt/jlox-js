import type { LiteralValue } from "./expr-types";
import { RuntimeError } from "./interpreter";
import type Token from "./token";

export default class Environment {
  enclosing: Environment | null;
  values = new Map<string, LiteralValue | undefined>();

  constructor(enclosing: Environment | null = null) {
    this.enclosing = enclosing;
  }

  define(name: string, value: LiteralValue | undefined) {
    this.values.set(name, value);
  }

  get(name: Token): LiteralValue {
    if (this.values.has(name.lexeme)) {
      const value = this.values.get(name.lexeme);

      if (value === undefined) {
        throw new RuntimeError(
          name,
          `Accessed variable ${name.lexeme} before initialization.`
        );
      }

      return value;
    }

    if (this.enclosing !== null) {
      return this.enclosing.get(name);
    }

    throw new RuntimeError(name, `Undefined variable ${name.lexeme}.`);
  }

  assign(name: Token, value: LiteralValue): void {
    if (this.values.has(name.lexeme)) {
      this.values.set(name.lexeme, value);
      return;
    }

    if (this.enclosing !== null) {
      return this.enclosing.assign(name, value);
    }

    throw new RuntimeError(name, `Undefined variable '${name.lexeme}'.`);
  }
}
