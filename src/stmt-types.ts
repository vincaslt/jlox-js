import type { Expr } from "./expr-types";
import type Token from "./token";

export type Expression = {
  __type: "Expression";
  expression: Expr;
};

export type Var = {
  __type: "Var";
  name: Token;
  initializer?: Expr;
};

export type Print = {
  __type: "Print";
  expression: Expr;
};

export type Stmt = Expression | Print | Var;
