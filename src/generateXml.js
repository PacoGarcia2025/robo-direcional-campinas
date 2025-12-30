import fs from "fs";

export default function generateXml(empreendimentos) {
  // 🔹 MRV gera XML direto, então pode não passar dados aqui
  if (!Array.isArray(empreendimentos) || empreendimentos.length === 0) {
    console.log("ℹ️ Nenhum XML adicional para gerar (robô já gerou o XML)");
    return;
  }

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<empreendimentos>\n`;

  empreendimentos.forEach((emp) => {
    xml += `
  <empreendimento>
    <id>${emp.id || ""}</id>
    <titulo><![CDATA[${emp.titulo || ""}]]></titulo>
    <cidade>${emp.cidade || ""}</cidade>
    <estado>${emp.estado || "SP"}</estado>
  </empreendimento>`;
  });

  xml += `\n</empreendimentos>`;

  fs.writeFileSync("empreendimentos.xml", xml, "utf-8");

  console.log("📄 XML adicional gerado com sucesso");
}
