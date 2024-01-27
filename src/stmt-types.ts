import type { Expr } from "./expr-types";

export type Expression = {
  __type: "Expression";
  expression: Expr;
};

export type Print = {
  __type: "Print";
  expression: Expr;
};

export type Stmt = Expression | Print;
