# jlox-js

This is a TypeScript implementation of the Java version of the tree-walk interpreter presented in the book [Crafing Interpreters](https://github.com/munificent/craftinginterpreters).

It's done for learning purposes because I find following code verbatim boring, so writing the code in TS forces me to actually understand it and reinterpret it.

I added some extra features not present in the original book implementation:

- Escaping string characters (\0 \n \b \t \\\ etc)

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run Lox.ts
```

This project was created using `bun init` in bun v1.0.21. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
