import type { Expr } from "./expr-types";
import type Token from "./token";

export type Expression = {
  __type: "Expression";
  expression: Expr;
};

export type If = {
  __type: "If";
  condition: Expr;
  thenBranch: Stmt;
  elseBranch?: Stmt;
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

export type Block = {
  __type: "Block";
  statements: Stmt[];
};

export type Stmt = Expression | Print | Var | Block | If;
