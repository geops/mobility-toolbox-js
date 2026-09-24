const fs = require("fs");
const path = require("path");

const dir = "src/types/realtime/asyncapi";
const files = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith(".ts") && f !== "index.ts")
  .sort();

// `enum` declarations are values, but `interface`/`type` declarations are
// type-only. Under `verbatimModuleSyntax`, `export default X;` is invalid
// when `X` only refers to a type, so those need `export type { X as default }`
// instead, both in the file itself and wherever it's re-exported.
const isTypeOnly = files.map((f) => {
  const name = f.replace(".ts", "");
  const content = fs.readFileSync(path.join(dir, f), "utf8");
  const typeOnly = !new RegExp(`^enum ${name}\\b`, "m").test(content);
  if (typeOnly) {
    fs.writeFileSync(
      path.join(dir, f),
      content.replace(
        new RegExp(`^export default ${name};$`, "m"),
        `export type { ${name} as default };`,
      ),
    );
  }
  return typeOnly;
});

const exportsContent = files
  .map((f, i) => {
    const name = f.replace(".ts", "");
    const exportKeyword = isTypeOnly[i] ? "export type" : "export";
    return `${exportKeyword} { default as ${name} } from './${name}';`;
  })
  .join("\n");
fs.writeFileSync(path.join(dir, "index.ts"), exportsContent + "\n");
