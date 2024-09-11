import { match } from "ts-pattern";
import type {
  Assign,
  Binary,
  Call,
  Expr,
  Grouping,
  Literal,
  LiteralValue,
  Logical,
  Ternary,
  Unary,
  Variable,
} from "./expr-types";
import TokenType from "./token-type";
import type Token from "./token";
import * as Lox from "~/lox";
import type {
  Block,
  Break,
  Continue,
  Expression,
  If,
  Print,
  Stmt,
  Var,
  While,
} from "./stmt-types";
import Environment from "./environment";
import { isCallable, type Callable } from "./lox-callable";

export type InterpreterOptions = { printExpressionStatements: boolean };

let loopCounter = 0;
let globals = new Environment();
let environment = globals;

globals.define("clock", {
  arity: () => 0,
  call: () => Date.now() / 1000,
} satisfies Callable);

function evaluate(expr: Expr): LiteralValue {
  return match(expr)
    .with({ __type: "Assign" }, evaluateAssignExpr)
    .with({ __type: "Variable" }, evaluateVariableExpr)
    .with({ __type: "Binary" }, evaluateBinaryExpr)
    .with({ __type: "Ternary" }, evaluateTernaryExpr)
    .with({ __type: "Grouping" }, evaluateGroupingExpr)
    .with({ __type: "Literal" }, evaluateLiteralExpr)
    .with({ __type: "Logical" }, evaluateLogicalExpr)
    .with({ __type: "Unary" }, evaluateUnaryExpr)
    .with({ __type: "Call" }, evaluateCallExpr)
    .exhaustive();
}

function execute(stmt: Stmt, options: InterpreterOptions): void {
  return match(stmt)
    .with({ __type: "Var" }, executeVarStmt)
    .with({ __type: "Print" }, executePrintStmt)
    .with({ __type: "While" }, (stmt) => executeWhileStmt(stmt, options))
    .with({ __type: "Expression" }, (stmt) => executeExprStmt(stmt, options))
    .with({ __type: "If" }, (stmt) => executeIfStmt(stmt, options))
    .with({ __type: "Block" }, (stmt) => executeBlockStmt(stmt, options))
    .with({ __type: "Break" }, executeBreakStatement)
    .with({ __type: "Continue" }, executeContinueStatement)
    .exhaustive();
}

function executePrintStmt(stmt: Print): void {
  const value = evaluate(stmt.expression);
  process.stdout.write(stringify(value) + "\n");
}

function executeExprStmt(stmt: Expression, options: InterpreterOptions): void {
  const result = evaluate(stmt.expression);
  if (options.printExpressionStatements) {
    process.stdout.write(stringify(result) + "\n");
  }
}

function executeIfStmt(stmt: If, options: InterpreterOptions): void {
  if (isTruthy(evaluate(stmt.condition))) {
    execute(stmt.thenBranch, options);
  } else if (stmt.elseBranch) {
    execute(stmt.elseBranch, options);
  }
}

function executeVarStmt(stmt: Var): void {
  let value: LiteralValue | undefined;
  if (stmt.initializer) {
    value = evaluate(stmt.initializer);
  }
  environment.define(stmt.name.lexeme, value);
}

function executeWhileStmt(stmt: While, options: InterpreterOptions): void {
  loopCounter += 1;

  while (isTruthy(evaluate(stmt.condition))) {
    try {
      execute(stmt.body, options);
    } catch (e) {
      if (!(e instanceof BreakLoop)) {
        throw e;
      }

      if (e.type === TokenType.BREAK) {
        break;
      }

      if (stmt.body.__type === "Block" && stmt.body.statements.length > 1) {
        execute(stmt.body.statements.at(-1)!, options);
      }

      continue;
    }
  }

  loopCounter -= 1;
}

function executeBreakStatement(): void {
  if (loopCounter > 0) {
    throw new BreakLoop(TokenType.BREAK);
  }
}

function executeContinueStatement(): void {
  if (loopCounter > 0) {
    throw new BreakLoop(TokenType.CONTINUE);
  }
}

function executeBlockStmt(stmt: Block, options: InterpreterOptions): void {
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

function evaluateLogicalExpr(expr: Logical): LiteralValue {
  const left = evaluate(expr.left);

  if (expr.operator.type === TokenType.OR) {
    if (isTruthy(left)) return left;
  } else {
    if (!isTruthy(left)) return left;
  }

  return evaluate(expr.right);
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

function evaluateCallExpr(expr: Call): LiteralValue {
  const callee = evaluate(expr.callee);

  const args: LiteralValue[] = [];
  for (const arg of expr.args) {
    args.push(evaluate(arg));
  }

  if (!isCallable(callee)) {
    throw new RuntimeError(expr.paren, "Can only call functions and classes.");
  }
  const fn = callee as unknown as Callable;

  if (args.length != fn.arity()) {
    throw new RuntimeError(
      expr.paren,
      `Expected ${fn.arity} arguments but got ${arguments.length}.`
    );
  }

  return fn.call(args);
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

export class BreakLoop extends Error {
  readonly type: TokenType;

  constructor(type: TokenType) {
    super();
    this.type = type;
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
