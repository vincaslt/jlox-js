import Scanner from "./scanner";

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
  for (const token of tokens) {
    process.stdout.write(token + "\n");
  }
}

export function error(line: number, message: string) {
  report(line, "", message);
}

function report(line: number, where: string, message: string) {
  process.stdout.write(
    "[line " + line + "] Error" + where + ": " + message + "\n"
  );
  hadError = true;
}
