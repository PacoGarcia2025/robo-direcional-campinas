import fs from "fs";
import path from "path";

export default function generateXml(empreendimentos) {
  const porRegiao = {};

  empreendimentos.forEach(emp => {
    if (!porRegiao[emp.regiao]) porRegiao[emp.regiao] = [];
    porRegiao[emp.regiao].push(emp);
  });

  Object.entries(porRegiao).forEach(([regiao, lista]) => {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<empreendimentos>\n`;

    lista.forEach(emp => {
      xml += `  <empreendimento>\n`;
      xml += `    <id>${emp.id}</id>\n`;
      xml += `    <regiao>${emp.regiao}</regiao>\n`;
      xml += `    <titulo><![CDATA[${emp.titulo || ""}]]></titulo>\n`;
      xml += `    <cidade><![CDATA[${emp.cidade}]]></cidade>\n`;
      xml += `    <estado><![CDATA[${emp.estado}]]></estado>\n`;
      xml += `    <status><![CDATA[${emp.status || ""}]]></status>\n`;

      // Tipologias
      xml += `    <tipologias>\n`;
      emp.tipologias.forEach(t => {
        xml += `      <tipologia>\n`;
        xml += `        <dormitorios>${t.dormitorios}</dormitorios>\n`;
        xml += `        <area>${t.area}</area>\n`;
        xml += `      </tipologia>\n`;
      });
      xml += `    </tipologias>\n`;

      // Imagens
      xml += `    <imagens>\n`;
      emp.imagens.forEach(img => {
        xml += `      <imagem><![CDATA[${img}]]></imagem>\n`;
      });
      xml += `    </imagens>\n`;

      // Ficha técnica
      xml += `    <ficha_tecnica>\n`;
      Object.entries(emp.ficha_tecnica).forEach(([k, v]) => {
        xml += `      <campo nome="${k}"><![CDATA[${v}]]></campo>\n`;
      });
      xml += `    </ficha_tecnica>\n`;

      xml += `    <url><![CDATA[${emp.url}]]></url>\n`;
      xml += `  </empreendimento>\n`;
    });

    xml += `</empreendimentos>`;

    const filePath = path.resolve("src/output", `direcional-${regiao}.xml`);
    fs.writeFileSync(filePath, xml, "utf8");

    console.log(`📦 XML gerado: ${filePath}`);
  });
}
