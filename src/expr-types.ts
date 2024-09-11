import type Token from "~/token";
import type { Callable } from "./lox-callable";

export type Assign = {
  __type: "Assign";
  name: Token;
  value: Expr;
};

export type Ternary = {
  __type: "Ternary";
  left: Expr;
  operatorLeft: Token;
  middle: Expr;
  operatorRight: Token;
  right: Expr;
};

export type Binary = {
  __type: "Binary";
  left: Expr;
  operator: Token;
  right: Expr;
};

export type Call = {
  __type: "Call";
  callee: Expr;
  paren: Token;
  args: Expr[];
};

export type Grouping = {
  __type: "Grouping";
  expression: Expr;
};

export type Literal = {
  __type: "Literal";
  value: LiteralValue;
};

export type Logical = {
  __type: "Logical";
  left: Expr;
  operator: Token;
  right: Expr;
};

export type Unary = {
  __type: "Unary";
  operator: Token;
  right: Expr;
};

export type Variable = {
  __type: "Variable";
  name: Token;
};

export type Expr =
  | Ternary
  | Binary
  | Grouping
  | Literal
  | Logical
  | Unary
  | Variable
  | Assign
  | Call;

export type LiteralValue = Callable | boolean | string | number | null;
