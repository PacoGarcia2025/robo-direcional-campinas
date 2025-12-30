import fs from "fs";

export default function generateXmlX09(empreendimentos) {
  // 🔹 MRV pode já ter gerado o XML internamente
  if (!Array.isArray(empreendimentos) || empreendimentos.length === 0) {
    console.log("ℹ️ Nenhum XML X09 adicional para gerar (robô MRV já gerou o arquivo)");
    return;
  }

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<empreendimentos>\n`;

  empreendimentos.forEach((emp) => {
    xml += `
  <empreendimento>
    <id>${emp.id || ""}</id>
    <titulo><![CDATA[${emp.titulo || ""}]]></titulo>
    <tipo>${emp.tipo || "Apartamento"}</tipo>
    <cidade>${emp.cidade || ""}</cidade>
    <estado>${emp.estado || "SP"}</estado>
    <status><![CDATA[${emp.status || ""}]]></status>
  </empreendimento>`;
  });

  xml += `\n</empreendimentos>`;

  fs.writeFileSync("mrv-x09.xml", xml, "utf-8");

  console.log("📄 XML X09 adicional gerado com sucesso");
}
