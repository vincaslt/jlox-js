import { match } from "ts-pattern";
import type {
  Assign,
  Binary,
  Expr,
  Grouping,
  Literal,
  LiteralValue,
  Ternary,
  Unary,
  Variable,
} from "./expr-types";
import TokenType from "./token-type";
import type Token from "./token";
import * as Lox from "~/lox";
import type { Block, Expression, Print, Stmt, Var } from "./stmt-types";
import Environment from "./environment";

export type InterpreterOptions = { printExpressionStatements: boolean };

let environment = new Environment();

function evaluate(expr: Expr): LiteralValue {
  return match(expr)
    .with({ __type: "Assign" }, evaluateAssignExpr)
    .with({ __type: "Variable" }, evaluateVariableExpr)
    .with({ __type: "Binary" }, evaluateBinaryExpr)
    .with({ __type: "Ternary" }, evaluateTernaryExpr)
    .with({ __type: "Grouping" }, evaluateGroupingExpr)
    .with({ __type: "Literal" }, evaluateLiteralExpr)
    .with({ __type: "Unary" }, evaluateUnaryExpr)
    .exhaustive();
}

function execute(stmt: Stmt, options: InterpreterOptions): void {
  return match(stmt)
    .with({ __type: "Var" }, evaluateVarStmt)
    .with({ __type: "Print" }, evaluatePrintStmt)
    .with({ __type: "Expression" }, (stmt) => evaluateExprStmt(stmt, options))
    .with({ __type: "Block" }, (stmt) => evaluateBlockStmt(stmt, options))
    .exhaustive();
}

function evaluatePrintStmt(stmt: Print): void {
  const value = evaluate(stmt.expression);
  process.stdout.write(stringify(value) + "\n");
}

function evaluateExprStmt(stmt: Expression, options: InterpreterOptions): void {
  const result = evaluate(stmt.expression);
  if (options.printExpressionStatements) {
    process.stdout.write(stringify(result) + "\n");
  }
}

function evaluateVarStmt(stmt: Var): void {
  let value: LiteralValue | undefined;
  if (stmt.initializer) {
    value = evaluate(stmt.initializer);
  }
  environment.define(stmt.name.lexeme, value);
}

function evaluateBlockStmt(stmt: Block, options: InterpreterOptions): void {
  const previous = environment;

  try {
    environment = new Environment(previous);
    for (const statement of stmt.statements) {
      execute(statement, options);
    }
  } finally {
    environment = previous;
  }
}

function evaluateAssignExpr(expr: Assign): LiteralValue {
  const value = evaluate(expr.value);
  environment.assign(expr.name, value);
  return value;
}

function evaluateVariableExpr(expr: Variable): LiteralValue {
  return environment.get(expr.name);
}

function evaluateLiteralExpr(expr: Literal): LiteralValue {
  return expr.value;
}

function evaluateGroupingExpr(expr: Grouping): LiteralValue {
  return evaluate(expr.expression);
}

function evaluateUnaryExpr(expr: Unary): LiteralValue {
  const right = evaluate(expr.right);

  switch (expr.operator.type) {
    case TokenType.MINUS:
      checkNumberOperand(expr.operator, right);
      return -Number(right);
    case TokenType.BANG:
      return !isTruthy(right);
  }

  // TODO: Unreachable, handle error
  return null;
}

function evaluateBinaryExpr(expr: Binary): LiteralValue {
  const left = evaluate(expr.left);
  const right = evaluate(expr.right);

  switch (expr.operator.type) {
    case TokenType.MINUS:
      checkNumberOperands(expr.operator, left, right);
      return Number(left) - Number(right);
    case TokenType.SLASH:
      checkNumberOperands(expr.operator, left, right);
      const rightNumOperand = Number(right);

      if (rightNumOperand === 0) {
        throw new RuntimeError(expr.operator, "Division by zero");
      }

      return Number(left) / rightNumOperand;
    case TokenType.STAR:
      checkNumberOperands(expr.operator, left, right);
      return Number(left) * Number(right);
    case TokenType.PLUS:
      if (typeof left === "number" && typeof right === "number") {
        return Number(left) + Number(right);
      }
      if (
        (typeof left === "string" || typeof left === "number") &&
        (typeof right === "string" || typeof right === "number")
      ) {
        return String(left) + String(right);
      }
      throw new RuntimeError(
        expr.operator,
        "Operands must be two numbers or two strings."
      );
    case TokenType.GREATER:
      checkNumberOperands(expr.operator, left, right);
      return Number(left) > Number(right);
    case TokenType.GREATER_EQUAL:
      checkNumberOperands(expr.operator, left, right);
      return Number(left) >= Number(right);
    case TokenType.LESS:
      checkNumberOperands(expr.operator, left, right);
      return Number(left) < Number(right);
    case TokenType.LESS_EQUAL:
      checkNumberOperands(expr.operator, left, right);
      return Number(left) <= Number(right);
    case TokenType.BANG_EQUAL:
      return left !== right;
    case TokenType.EQUAL_EQUAL:
      return left === right;
  }

  // TODO: unreachable, handle error
  return null;
}

function evaluateTernaryExpr(expr: Ternary): LiteralValue {
  const left = evaluate(expr.left);

  if (isTruthy(left)) {
    return evaluate(expr.middle);
  }
  return evaluate(expr.right);
}

function isTruthy(value: LiteralValue): boolean {
  if (value === null) {
    return false;
  }

  if (typeof value === "boolean") {
    return value;
  }

  return false;
}

function checkNumberOperand(operator: Token, operand: LiteralValue) {
  if (typeof operand !== "number" || isNaN(operand)) {
    throw new RuntimeError(operator, "Operand must be a number");
  }
}
function checkNumberOperands(
  operator: Token,
  left: LiteralValue,
  right: LiteralValue
) {
  if (
    typeof left !== "number" ||
    isNaN(left) ||
    typeof right !== "number" ||
    isNaN(right)
  ) {
    throw new RuntimeError(operator, "Operands must be a number");
  }
}

export class RuntimeError extends Error {
  readonly token: Token;

  constructor(token: Token, message: string) {
    super(message);
    this.token = token;
  }
}

function stringify(value: LiteralValue) {
  if (value === null) {
    return "nil";
  }

  return value.toString();
}

export function interpret(statements: Stmt[], options: InterpreterOptions) {
  try {
    for (const statement of statements) {
      execute(statement, options);
    }
  } catch (e) {
    if (e instanceof RuntimeError) {
      Lox.runtimeError(e);
    }
  }
}
