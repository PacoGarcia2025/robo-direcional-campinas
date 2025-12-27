import fs from "fs";
import path from "path";

export default function generateBaseJson(data) {
  const filePath = path.resolve("src/output/direcional.base.json");
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
  console.log("✅ Base JSON gerada:", data.length, "empreendimentos");
}

