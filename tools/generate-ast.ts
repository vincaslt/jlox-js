const ARGS_START = 2; // [bun, generate-ast, ...args]

const args = process.argv;

if (args.length !== ARGS_START + 1) {
  process.stdout.write("Usage: generate-ast <output-dir>\n");
  process.exit(64);
}

const outputDir = args[ARGS_START];

defineAst(outputDir, "expr-types.ts", "Expr", {
  Binary: {
    left: "Expr",
    operator: "Token",
    right: "Expr",
  },
  Grouping: {
    expression: "Expr",
  },
  Literal: {
    value: "string | number | null",
  },
  Unary: {
    operator: "Token",
    right: "Expr",
  },
});

function defineAst(
  outputDir: string,
  fileName: string,
  baseName: string,
  types: Record<string, Record<string, string>>
) {
  const file = Bun.file(`${outputDir}/${fileName}`);
  const writer = file.writer();

  writer.write(`import type Token from "~/token";\n`);

  for (const [type, fields] of Object.entries(types)) {
    const fieldsStr = [
      `  __type: "${type}";`,
      ...Object.entries(fields).map(
        ([fieldName, fieldType]) => `  ${fieldName}: ${fieldType};`
      ),
    ].join("\n");

    writer.write(`\nexport type ${type} = {\n${fieldsStr}\n};\n`);
  }

  const typesUnion = Object.keys(types).join(" | ");
  writer.write(`\nexport type ${baseName} = ${typesUnion};\n`);

  writer.flush();
}
