import type { Expr } from "./expr-types";
import type Token from "./token";

export type Expression = {
  __type: "Expression";
  expression: Expr;
};

export type Function = {
  __type: "Function";
  name: Token;
  params: Token[];
  body: Stmt[];
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

export type While = {
  __type: "While";
  condition: Expr;
  body: Stmt;
};

export type Break = {
  __type: "Break";
};

export type Continue = {
  __type: "Continue";
};

export type Block = {
  __type: "Block";
  statements: Stmt[];
};

export type Stmt =
  | Expression
  | Print
  | Var
  | Block
  | If
  | While
  | Break
  | Continue
  | Function;
