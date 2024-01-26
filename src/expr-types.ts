import type Token from "~/token";

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

export type Unary = {
  __type: "Unary";
  operator: Token;
  right: Expr;
};

export type Expr = Ternary | Binary | Grouping | Literal | Unary;

export type LiteralValue = boolean | string | number | null;
