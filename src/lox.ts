import { printAst } from "./ast-printer";
import Parser from "./parser";
import Scanner from "./scanner";
import type Token from "./token";
import TokenType from "./token-type";

const ARGS_START = 2; // [bun, lox, ...args]

const args = process.argv;

let hadError = false;

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
    run(line);
    hadError = false;
    process.stdout.write(prompt);
  }
}

async function runFile(path: string) {
  const file = Bun.file(path);
  const content = await file.text();
  run(content);
  if (hadError) {
    process.exit(65);
  }
}

function run(source: string) {
  const scanner = new Scanner(source);
  const tokens = scanner.scanTokens();

  const parser = new Parser(tokens);
  const expression = parser.parse();

  if (hadError) {
    return;
  }

  process.stdout.write(printAst(expression!) + "\n");
}

export function error(token: Token, message: string) {
  if (token.type === TokenType.EOF) {
    report(token.line, " at end", message);
  } else {
    report(token.line, `at '${token.lexeme}'`, message);
  }
}

function report(line: number, where: string, message: string) {
  process.stdout.write(
    "[line " + line + "] Error" + where + ": " + message + "\n"
  );
  hadError = true;
}
