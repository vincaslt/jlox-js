import type TokenType from "./token-type";

export default class Token {
  readonly type: TokenType;
  readonly lexeme: string;
  readonly literal: string | number | null;
  readonly line: number;

  constructor(
    type: TokenType,
    lexeme: string,
    literal: string | number | null,
    line: number
  ) {
    this.type = type;
    this.lexeme = lexeme;
    this.literal = literal;
    this.line = line;
  }

  toString() {
    return this.type + " " + this.lexeme + " " + this.literal;
  }
}
