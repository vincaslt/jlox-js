import type Token from "~/token";

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
  | Assign;

export type LiteralValue = boolean | string | number | null;
