import fs from "fs";
import path from "path";

export default function generateBaseJson(data, prefix = "direcional") {
  const filePath = path.resolve(`src/output/${prefix}.base.json`);

  fs.writeFileSync(
    filePath,
    JSON.stringify(data, null, 2),
    "utf8"
  );

  console.log(
    `✅ Base JSON gerada (${prefix}):`,
    data.length,
    "empreendimentos"
  );
}
