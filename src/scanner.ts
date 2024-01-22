import Token from "./token";
import TokenType from "./token-type";
import * as Lox from "./lox";

export default class Scanner {
  private readonly source: string;
  private readonly tokens: Token[] = [];
  private static readonly keywords = {
    and: TokenType.AND,
    class: TokenType.CLASS,
    else: TokenType.ELSE,
    false: TokenType.FALSE,
    for: TokenType.FOR,
    fun: TokenType.FUN,
    if: TokenType.IF,
    nil: TokenType.NIL,
    or: TokenType.OR,
    print: TokenType.PRINT,
    return: TokenType.RETURN,
    super: TokenType.SUPER,
    this: TokenType.THIS,
    true: TokenType.TRUE,
    var: TokenType.VAR,
    while: TokenType.WHILE,
  } as const;

  /** The start of the current token */
  private start = 0;

  /** The current character's index in source */
  private current = 0;

  /** The current line */
  private line = 1;

  constructor(source: string) {
    this.source = source;
  }

  scanTokens() {
    while (!this.isAtEnd) {
      this.start = this.current;
      this.scanToken();
    }

    this.tokens.push(new Token(TokenType.EOF, "", null, this.line));
    return this.tokens;
  }

  private scanToken() {
    const c = this.advance();
    switch (c) {
      case "(":
        this.addToken(TokenType.LEFT_PAREN);
        break;
      case ")":
        this.addToken(TokenType.RIGHT_PAREN);
        break;
      case "{":
        this.addToken(TokenType.LEFT_BRACE);
        break;
      case "}":
        this.addToken(TokenType.RIGHT_BRACE);
        break;
      case ",":
        this.addToken(TokenType.COMMA);
        break;
      case ".":
        this.addToken(TokenType.DOT);
        break;
      case "-":
        this.addToken(TokenType.MINUS);
        break;
      case "+":
        this.addToken(TokenType.PLUS);
        break;
      case ";":
        this.addToken(TokenType.SEMICOLON);
        break;
      case ":":
        this.addToken(TokenType.COLON);
        break;
      case "*":
        this.addToken(TokenType.STAR);
        break;
      case "?":
        this.addToken(TokenType.QUESTION_MARK);
        break;
      case "!":
        this.addToken(this.match("=") ? TokenType.BANG_EQUAL : TokenType.BANG);
        break;
      case "=":
        this.addToken(
          this.match("=") ? TokenType.EQUAL_EQUAL : TokenType.EQUAL
        );
        break;
      case "<":
        this.addToken(this.match("=") ? TokenType.LESS_EQUAL : TokenType.LESS);
        break;
      case ">":
        this.addToken(
          this.match("=") ? TokenType.GREATER_EQUAL : TokenType.GREATER
        );
        break;
      case "/":
        if (this.match("/")) {
          while (this.peek() !== "\n" && !this.isAtEnd) {
            this.advance();
          }
        } else {
          this.addToken(TokenType.SLASH);
        }
        break;
      case " ":
      case "\r":
      case "\t":
        break;
      case "\n":
        this.line += 1;
        break;
      case '"':
        this.string();
        break;
      default:
        if (this.isDigit(c)) {
          this.number();
        } else if (this.isAlpha(c)) {
          this.identifier();
        } else {
          Lox.report(this.line, ` at ${c}`, "Unexpected character.");
        }
    }
  }

  private get isAtEnd() {
    return this.current >= this.source.length;
  }

  private advance() {
    const char = this.source.charAt(this.current);
    this.current += 1;
    return char;
  }

  private addToken(type: TokenType, literal: string | number | null = null) {
    const text = this.source.substring(this.start, this.current);
    this.tokens.push(new Token(type, text, literal, this.line));
  }

  private match(expected: string) {
    if (this.isAtEnd || this.source.charAt(this.current) !== expected) {
      return false;
    }
    this.current += 1;
    return true;
  }

  private peek() {
    if (this.isAtEnd) return "\0";
    return this.source.charAt(this.current);
  }

  private peekNext() {
    if (this.current + 1 >= this.source.length) return "\0";
    return this.source.charAt(this.current + 1);
  }

  private string() {
    while (!this.isAtEnd && this.peek() !== '"') {
      if (this.peek() === "\n") {
        this.line += 1;
      }
      if (this.peek() === "\\") {
        this.advance(); // Ignore the escaped character
      }
      this.advance();
    }

    if (this.isAtEnd) {
      Lox.report(this.line, "", "Unterminated string");
      return;
    }

    // The closing `"`
    this.advance();

    // Trim surrounding quotes
    const value = this.source.substring(this.start + 1, this.current - 1);
    this.addToken(TokenType.STRING, this.unescapeString(value));
  }

  private unescapeString(value: string) {
    let escapedValue = "";
    let i = 0;
    while (i < value.length) {
      let current = value[i];
      i += 1;

      if (current !== "\\") {
        escapedValue += current;
        continue;
      }

      let next = value[i];
      i += 1;

      // Replace the escaped character
      switch (next) {
        case "0":
          escapedValue += "\0";
          break;
        case "n":
          escapedValue += "\n";
          break;
        case "t":
          escapedValue += "\t";
          break;
        case "b":
          escapedValue = this.source.substring(0, escapedValue.length - 1);
          break;
        default:
          escapedValue += next;
      }
    }
    return escapedValue;
  }

  private isDigit(c: string) {
    return c >= "0" && c <= "9";
  }

  private number() {
    while (this.isDigit(this.peek())) {
      this.advance();
    }

    // Look for a fractional part
    if (this.peek() === "." && this.isDigit(this.peekNext())) {
      // Consume the `.`
      this.advance();

      while (this.isDigit(this.peek())) {
        this.advance();
      }
    }

    this.addToken(
      TokenType.NUMBER,
      parseFloat(this.source.substring(this.start, this.current))
    );
  }

  private isAlpha(c: string) {
    return (c >= "a" && c <= "z") || (c >= "A" && c <= "Z") || c === "_";
  }

  private isAlphaNumeric(c: string) {
    return this.isAlpha(c) || this.isDigit(c);
  }

  private identifier() {
    while (this.isAlphaNumeric(this.peek())) {
      this.advance();
    }
    const text = this.source.substring(this.start, this.current);
    if (keyIn(Scanner.keywords, text)) {
      this.addToken(Scanner.keywords[text]);
    } else {
      this.addToken(TokenType.IDENTIFIER);
    }
  }
}

function keyIn<T extends object>(o: T, t: string): t is keyof T & string {
  return t in o;
}
