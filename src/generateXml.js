import fs from "fs";
import path from "path";

export default function generateXml(empreendimentos, prefix = "direcional") {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<empreendimentos>\n`;

  empreendimentos.forEach((emp) => {
    xml += `  <empreendimento>\n`;
    xml += `    <id>${emp.id}</id>\n`;
    xml += `    <regiao>${emp.regiao || ""}</regiao>\n`;
    xml += `    <titulo><![CDATA[${emp.titulo || ""}]]></titulo>\n`;
    xml += `    <cidade><![CDATA[${emp.cidade || ""}]]></cidade>\n`;
    xml += `    <estado><![CDATA[${emp.estado || ""}]]></estado>\n`;
    xml += `    <status><![CDATA[${emp.status || ""}]]></status>\n`;
    xml += `    <url><![CDATA[${emp.url || ""}]]></url>\n`;

    // 🔹 TIPOLOGIAS
    xml += `    <tipologias>\n`;
    (emp.tipologias || []).forEach((t) => {
      xml += `      <tipologia>\n`;
      xml += `        <dormitorios>${t.dormitorios}</dormitorios>\n`;
      xml += `        <area>${t.area}</area>\n`;
      xml += `      </tipologia>\n`;
    });
    xml += `    </tipologias>\n`;

    // 🔹 FICHA TÉCNICA
    xml += `    <ficha_tecnica>\n`;
    if (emp.ficha_tecnica) {
      Object.entries(emp.ficha_tecnica).forEach(([k, v]) => {
        const key = k.toLowerCase().replace(/[^a-z0-9]+/g, "_");
        xml += `      <${key}><![CDATA[${v}]]></${key}>\n`;
      });
    }
    xml += `    </ficha_tecnica>\n`;

    // 🔹 IMAGENS
    xml += `    <fotos>\n`;
    (emp.imagens || []).forEach((img) => {
      xml += `      <foto><![CDATA[${img}]]></foto>\n`;
    });
    xml += `    </fotos>\n`;

    xml += `  </empreendimento>\n`;
  });

  xml += `</empreendimentos>`;

  const filePath = path.resolve("src/output", `${prefix}.xml`);
  fs.writeFileSync(filePath, xml, "utf8");

  console.log(
    `📦 XML RICO gerado (${prefix}): ${empreendimentos.length} empreendimentos`
  );
}
