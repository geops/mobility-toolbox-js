const fs = require("fs");
const files = fs
  .readdirSync("src/types/realtime/asyncapi")
  .filter((f) => f.endsWith(".ts") && f !== "index.ts");
const exportsContent = files
  .map(
    (f) =>
      `export { default as ${f.replace(".ts", "")} } from './${f.replace(".ts", "")}';`,
  )
  .join("\n");
fs.writeFileSync("src/types/realtime/asyncapi/index.ts", exportsContent + "\n");
