import { match } from "ts-pattern";
import type { Expr } from "./expr-types";

function parenthesize(name: string, ...exprs: Expr[]) {
  let str = "(" + name;
  for (const expr of exprs) {
    str += " " + printAst(expr);
  }
  str += ")";
  return str;
}

export function printAst(ast: Expr) {
  return match(ast)
    .with({ __type: "Binary" }, (expr) =>
      parenthesize(expr.operator.lexeme, expr.left, expr.right)
    )
    .with({ __type: "Grouping" }, (expr) =>
      parenthesize("group", expr.expression)
    )
    .with({ __type: "Literal" }, (expr) =>
      expr.value === null ? "nil" : `${expr.value}`
    )
    .with({ __type: "Unary" }, (expr) =>
      parenthesize(expr.operator.lexeme, expr.right)
    )
    .exhaustive();
}

// const expression = {
//   __type: "Binary",
//   left: {
//     __type: "Unary",
//     operator: new Token(TokenType.MINUS, "-", null, 1),
//     right: {
//       __type: "Literal",
//       value: 123,
//     },
//   },
//   operator: new Token(TokenType.STAR, "*", null, 1),
//   right: {
//     __type: "Grouping",
//     expression: {
//       __type: "Literal",
//       value: 45.67,
//     },
//   },
// } satisfies Expr;

// console.log(printAst(expression));
