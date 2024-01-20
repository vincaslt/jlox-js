import { P } from "ts-pattern";
import type { Binary, Expr, Grouping, Literal, Unary } from "./expr-types";
import Token from "./token";
import TokenType from "./token-type";

export default class Parser {
  private readonly tokens: Token[];
  private current = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private expression(): Expr {
    return this.equality();
  }

  private equality(): Expr {
    let left = this.comparison();

    while (this.match(TokenType.BANG_EQUAL, TokenType.EQUAL_EQUAL)) {
      const operator = this.previous();
      const right = this.comparison();
      left = { __type: "Binary", left, operator, right } satisfies Binary;
    }

    return left;
  }

  private comparison(): Expr {
    let left = this.term();

    while (
      this.match(
        TokenType.GREATER,
        TokenType.GREATER_EQUAL,
        TokenType.LESS,
        TokenType.LESS_EQUAL
      )
    ) {
      const operator = this.previous();
      const right = this.term();
      left = { __type: "Binary", left, operator, right } satisfies Binary;
    }

    return left;
  }

  private term(): Expr {
    let left = this.factor();

    while (this.match(TokenType.MINUS, TokenType.PLUS)) {
      const operator = this.previous();
      const right = this.factor();
      left = { __type: "Binary", left, operator, right } satisfies Binary;
    }

    return left;
  }

  private factor(): Expr {
    let left = this.unary();

    while (this.match(TokenType.SLASH, TokenType.STAR)) {
      const operator = this.previous();
      const right = this.unary();
      left = { __type: "Binary", left, operator, right } satisfies Binary;
    }

    return left;
  }

  private unary(): Expr {
    if (this.match(TokenType.BANG, TokenType.MINUS)) {
      const operator = this.previous();
      const right = this.unary();
      return { __type: "Unary", operator, right } satisfies Unary;
    }

    return this.primary();
  }

  private primary(): Expr {
    if (this.match(TokenType.FALSE)) {
      return { __type: "Literal", value: false } satisfies Literal;
    }
    if (this.match(TokenType.TRUE)) {
      return { __type: "Literal", value: true } satisfies Literal;
    }
    if (this.match(TokenType.NIL)) {
      return { __type: "Literal", value: null } satisfies Literal;
    }

    if (this.match(TokenType.NUMBER, TokenType.STRING)) {
      const token = this.previous();
      return { __type: "Literal", value: token.literal } satisfies Literal;
    }

    if (this.match(TokenType.LEFT_PAREN)) {
      const expression = this.expression();
      this.consume(TokenType.RIGHT_PAREN, "Expect ')' after expression");
      return { __type: "Grouping", expression } satisfies Grouping;
    }

    throw new Error("Handle undetected stuff?");
  }

  private consume(type: TokenType, message: string) {
    // TODO: implement
    throw new Error("Not yet implemented");
  }

  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) {
      return false;
    }
    return this.peek()?.type === type;
  }

  private advance() {
    if (!this.isAtEnd()) {
      this.current += 1;
    }
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.peek()?.type === TokenType.EOF;
  }

  private peek() {
    return this.tokens.at(this.current);
  }

  private previous() {
    return this.tokens.at(this.current - 1)!;
  }
}
