import { P } from "ts-pattern";
import type {
  Assign,
  Binary,
  Expr,
  Grouping,
  Literal,
  Logical,
  Ternary,
  Unary,
  Variable,
} from "./expr-types";
import * as Lox from "./lox";
import type { Block, Expression, If, Print, Stmt, Var } from "./stmt-types";
import Token from "./token";
import TokenType from "./token-type";

export default class Parser {
  private readonly tokens: Token[];
  private current = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  public parse() {
    const statements: Stmt[] = [];

    while (!this.isAtEnd()) {
      const declaration = this.declaration();
      if (declaration !== null) {
        statements.push(declaration);
      }
    }

    return statements;
  }

  private declaration() {
    try {
      if (this.match(TokenType.VAR)) {
        return this.varDeclaration();
      }
      return this.statement();
    } catch (e) {
      this.synchronize();
      return null;
    }
  }

  private varDeclaration(): Var {
    const name = this.consume(TokenType.IDENTIFIER, "Expect variable name");

    let initializer: Expr | undefined;
    if (this.match(TokenType.EQUAL)) {
      initializer = this.expression();
    }

    this.consume(TokenType.SEMICOLON, "Expect ';' after variable declaration");
    return { __type: "Var", name, initializer };
  }

  private statement(): Stmt {
    if (this.match(TokenType.IF)) {
      return this.ifStatement();
    }
    if (this.match(TokenType.PRINT)) {
      return this.printStatement();
    }
    if (this.match(TokenType.LEFT_BRACE)) {
      return { __type: "Block", statements: this.block() } satisfies Block;
    }
    return this.exprStatement();
  }

  ifStatement(): If {
    this.consume(TokenType.LEFT_PAREN, "Expect '(' after if.");
    const condition = this.expression();
    this.consume(TokenType.RIGHT_PAREN, "Expect ')' after if condition.");

    const thenBranch = this.statement();

    let elseBranch: Stmt | undefined;
    if (this.match(TokenType.ELSE)) {
      elseBranch = this.statement();
    }

    return {
      __type: "If",
      condition,
      thenBranch,
      elseBranch,
    };
  }

  private exprStatement(): Expression {
    const expression = this.expression();
    this.consume(TokenType.SEMICOLON, "Expect ';' after value");
    return { __type: "Expression", expression };
  }

  private printStatement(): Print {
    const expression = this.expression();
    this.consume(TokenType.SEMICOLON, "Expect ';' after value");
    return { __type: "Print", expression };
  }

  private block() {
    const statements: Stmt[] = [];

    while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
      const declaration = this.declaration();
      if (declaration) {
        statements.push(declaration);
      }
    }
    this.consume(TokenType.RIGHT_BRACE, "Expect '}' after block.");
    return statements;
  }

  private expression(): Expr {
    return this.assignment();
  }

  private assignment(): Expr {
    const expr = this.commaExpression();

    if (this.match(TokenType.EQUAL)) {
      const equals = this.previous();
      const value = this.commaExpression();
      if (expr.__type === "Variable") {
        const name = expr.name;
        return { __type: "Assign", name, value } satisfies Assign;
      }
      this.error(equals, "Invalid assignment target.");
    }

    return expr;
  }

  private commaExpression(): Expr {
    if (this.match(TokenType.COMMA)) {
      const operator = this.previous();
      this.ternary(); // Discard right operand
      throw this.error(
        operator,
        `Binary operator \`${operator.lexeme}\` missing left operand.`
      );
    }

    let left = this.ternary();

    while (this.match(TokenType.COMMA)) {
      const operator = this.previous();
      const right = this.ternary();
      left = { __type: "Binary", left, operator, right } satisfies Binary;
    }

    return left;
  }

  private ternary(): Expr {
    const left = this.or();

    if (this.match(TokenType.QUESTION_MARK)) {
      const operatorLeft = this.previous();
      const middle = this.ternary();

      if (this.match(TokenType.COLON)) {
        const operatorRight = this.previous();
        const right = this.ternary();
        return {
          __type: "Ternary",
          left,
          operatorLeft,
          middle,
          operatorRight,
          right,
        } satisfies Ternary;
      } else {
        throw this.error(this.peek(), "Expect right expression in ternary.");
      }
    }

    return left;
  }

  private or(): Expr {
    const left = this.and();

    while (this.match(TokenType.OR)) {
      const operator = this.previous();
      const right = this.and();
      return {
        __type: "Logical",
        left,
        operator,
        right,
      } satisfies Logical;
    }

    return left;
  }

  private and(): Expr {
    const left = this.equality();

    while (this.match(TokenType.AND)) {
      const operator = this.previous();
      const right = this.equality();
      return {
        __type: "Logical",
        left,
        operator,
        right,
      } satisfies Logical;
    }

    return left;
  }

  private equality(): Expr {
    if (this.match(TokenType.BANG_EQUAL, TokenType.EQUAL_EQUAL)) {
      const operator = this.previous();
      this.comparison(); // Discard right operand
      throw this.error(
        operator,
        `Binary operator \`${operator.lexeme}\` missing left operand.`
      );
    }

    let left = this.comparison();

    while (this.match(TokenType.BANG_EQUAL, TokenType.EQUAL_EQUAL)) {
      const operator = this.previous();
      const right = this.comparison();
      left = { __type: "Binary", left, operator, right } satisfies Binary;
    }

    return left;
  }

  private comparison(): Expr {
    if (
      this.match(
        TokenType.GREATER,
        TokenType.GREATER_EQUAL,
        TokenType.LESS,
        TokenType.LESS_EQUAL
      )
    ) {
      const operator = this.previous();
      this.consume(
        operator.type,
        `Binary operator \`${operator.lexeme}\` missing left operand.`
      );
      this.term(); // Discard right operand
    }

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
    if (this.match(TokenType.MINUS, TokenType.PLUS)) {
      const operator = this.previous();
      this.factor(); // Discard right operand
      throw this.error(
        operator,
        `Binary operator \`${operator.lexeme}\` missing left operand.`
      );
    }

    let left = this.factor();

    while (this.match(TokenType.MINUS, TokenType.PLUS)) {
      const operator = this.previous();
      const right = this.factor();
      left = { __type: "Binary", left, operator, right } satisfies Binary;
    }

    return left;
  }

  private factor(): Expr {
    if (this.match(TokenType.SLASH, TokenType.STAR)) {
      const operator = this.previous();
      this.unary(); // Discard right operand
      throw this.error(
        operator,
        `Binary operator \`${operator.lexeme}\` missing left operand.`
      );
    }

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

    if (this.match(TokenType.IDENTIFIER)) {
      return { __type: "Variable", name: this.previous() } satisfies Variable;
    }

    if (this.match(TokenType.LEFT_PAREN)) {
      const expression = this.expression();
      this.consume(TokenType.RIGHT_PAREN, "Expect ')' after expression");
      return { __type: "Grouping", expression } satisfies Grouping;
    }

    throw this.error(this.peek(), "Expect expression.");
  }

  private consume(type: TokenType, message: string) {
    if (this.check(type)) {
      return this.advance();
    }
    throw this.error(this.peek(), message);
  }

  private error(token: Token, message: string) {
    Lox.error(token, message);
    return new ParseError();
  }

  private synchronize() {
    this.advance();

    while (!this.isAtEnd()) {
      if (this.previous().type === TokenType.SEMICOLON) return;

      switch (this.peek().type) {
        case TokenType.CLASS:
        case TokenType.FUN:
        case TokenType.VAR:
        case TokenType.FOR:
        case TokenType.IF:
        case TokenType.WHILE:
        case TokenType.PRINT:
        case TokenType.RETURN:
          return;
      }

      this.advance();
    }
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
    return this.tokens.at(this.current)!;
  }

  private previous() {
    return this.tokens.at(this.current - 1)!;
  }
}

class ParseError extends Error {}
