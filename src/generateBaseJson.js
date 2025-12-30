import fs from "fs";

export default function generateBaseJson(data) {
  if (!data) {
    console.log("ℹ️ Nenhum JSON base para gerar (MRV gera XML direto)");
    return;
  }

  const output = "base.json";

  fs.writeFileSync(
    output,
    JSON.stringify(data, null, 2),
    "utf-8"
  );

  console.log("📦 Base JSON gerado com sucesso");
}
