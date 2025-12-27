import fs from "fs";
import path from "path";

export default function generateXml(empreendimentos) {
  const porRegiao = {};

  empreendimentos.forEach((emp) => {
    if (!porRegiao[emp.regiao]) {
      porRegiao[emp.regiao] = [];
    }
    porRegiao[emp.regiao].push(emp);
  });

  Object.entries(porRegiao).forEach(([regiao, lista]) => {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<empreendimentos>\n`;

    lista.forEach((emp) => {
      xml += `  <empreendimento>\n`;
      xml += `    <regiao>${regiao}</regiao>\n`;
      xml += `    <titulo><![CDATA[${emp.nome || ""}]]></titulo>\n`;
      xml += `    <cidade><![CDATA[${emp.location || ""}]]></cidade>\n`;
      xml += `    <status><![CDATA[${emp.status || ""}]]></status>\n`;
      xml += `    <url><![CDATA[${emp.url}]]></url>\n`;
      xml += `  </empreendimento>\n`;
    });

    xml += `</empreendimentos>`;

    const filePath = path.resolve(
      "src/output",
      `direcional-${regiao}.xml`
    );

    fs.writeFileSync(filePath, xml, "utf8");
    console.log(`📦 XML gerado: ${filePath}`);
  });
}
