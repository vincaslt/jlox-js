import type Token from "~/token";

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
  value: boolean | string | number | null;
};

export type Unary = {
  __type: "Unary";
  operator: Token;
  right: Expr;
};

export type Expr = Binary | Grouping | Literal | Unary;
