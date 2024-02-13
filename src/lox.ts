import {
  interpret,
  type InterpreterOptions,
  type RuntimeError,
} from "./interpreter";
import Parser from "./parser";
import Scanner from "./scanner";
import type Token from "./token";
import TokenType from "./token-type";

const ARGS_START = 2; // [bun, lox, ...args]

const args = process.argv;

let hadError = false;
let hadRuntimeError = false;

if (args.length > ARGS_START + 1) {
  process.stdout.write("Usage: jlox [script]\n");
  process.exit(64);
} else if (args.length == ARGS_START + 1) {
  runFile(args[ARGS_START]);
} else {
  runPrompt();
}

async function runPrompt() {
  const prompt = "> ";
  process.stdout.write(prompt);
  for await (const line of console) {
    if (!line) {
      break;
    }
    run(line, { printExpressionStatements: true });
    hadError = false;
    process.stdout.write(prompt);
  }
}

async function runFile(path: string) {
  const file = Bun.file(path);
  const content = await file.text();
  run(content, { printExpressionStatements: false });
  if (hadError) {
    process.exit(65);
  }
  if (hadRuntimeError) {
    process.exit(70);
  }
}

function run(source: string, options: InterpreterOptions) {
  const scanner = new Scanner(source);
  const tokens = scanner.scanTokens();

  const parser = new Parser(tokens);
  const statements = parser.parse();

  if (hadError) {
    return;
  }

  interpret(statements, options);
}

export function error(token: Token, message: string) {
  if (token.type === TokenType.EOF) {
    report(token.line, " at end", message);
  } else {
    report(token.line, ` at '${token.lexeme}'`, message);
  }
}

export function report(line: number, where: string, message: string) {
  process.stdout.write(
    "[line " + line + "] Error" + where + ": " + message + "\n"
  );
  hadError = true;
}

export function runtimeError(error: RuntimeError) {
  process.stderr.write(
    `Runtime error: ${error.message}\n[line ${error.token.line}]\n`
  );
  hadRuntimeError = true;
}
