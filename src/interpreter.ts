import { match } from "ts-pattern";
import type {
  Expr,
  Grouping,
  Literal,
  LiteralValue,
  Ternary,
  Unary,
} from "./expr-types";
import TokenType from "./token-type";

function evaluate(expr: Expr): LiteralValue {
  return (
    match(expr)
      // .with({ __type: "Ternary" }, (expr) =>
      //   parenthesize(
      //     expr.operatorLeft.lexeme + expr.operatorRight.lexeme,
      //     expr.left,
      //     expr.middle,
      //     expr.right
      //   )
      // )
      // .with({ __type: "Binary" }, (expr) =>
      //   parenthesize(expr.operator.lexeme, expr.left, expr.right)
      // )
      .with({ __type: "Ternary" }, evaluateTernaryExpr)
      .with({ __type: "Grouping" }, evaluateGroupingExpr)
      .with({ __type: "Literal" }, evaluateLiteralExpr)
      .with({ __type: "Unary" }, evaluateUnaryExpr)
      .exhaustive()
  );
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
      return -Number(right);
    case TokenType.BANG:
      return !isTruthy(right);
  }

  // TODO: Unreachable, handle error
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
