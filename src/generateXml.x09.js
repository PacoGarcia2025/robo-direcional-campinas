import fs from "fs";
import path from "path";

export default function generateXmlX09(empreendimentos) {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<imoveis>\n`;

  empreendimentos.forEach((emp) => {
    // 🔹 DESCRIÇÃO (texto plano – x09 entende 100%)
    let descricao = "";

    if (emp.tipologias && emp.tipologias.length > 0) {
      const dorms = [
        ...new Set(emp.tipologias.map((t) => t.dormitorios)),
      ].sort();

      const areas = [
        ...new Set(emp.tipologias.map((t) => t.area)),
      ].sort((a, b) => a - b);

      descricao += `Apartamentos de ${dorms.join(" e ")} dormitórios.\n`;
      descricao += `Áreas de ${areas
        .map((a) => `${a}m²`)
        .join(" e ")}.\n\n`;
    }

    if (emp.ficha_tecnica && Object.keys(emp.ficha_tecnica).length > 0) {
      descricao += "Ficha técnica:\n";
      Object.entries(emp.ficha_tecnica).forEach(([k, v]) => {
        descricao += `- ${k}: ${v}\n`;
      });
      descricao += "\n";
    }

    // fallback mínimo
    if (!descricao) {
      descricao = emp.titulo || "Empreendimento residencial";
    }

    xml += `  <imovel>\n`;
    xml += `    <id>${emp.id}</id>\n`;
    xml += `    <title><![CDATA[${emp.titulo || ""}]]></title>\n`;

    // 🔹 FOTOS
    xml += `    <fotos>\n`;
    (emp.imagens || []).forEach((img) => {
      xml += `      <foto><![CDATA[${img}]]></foto>\n`;
    });
    xml += `    </fotos>\n`;

    // 🔹 LOCALIZAÇÃO
    xml += `    <city><![CDATA[${emp.cidade || ""}]]></city>\n`;
    xml += `    <state><![CDATA[${emp.estado || ""}]]></state>\n`;

    // 🔹 CLASSIFICAÇÃO
    xml += `    <tipo>Apartamento</tipo>\n`;
    xml += `    <status><![CDATA[${emp.status || ""}]]></status>\n`;

    // 🔹 DESCRIÇÃO FINAL
    xml += `    <descricao><![CDATA[${descricao.trim()}]]></descricao>\n`;

    // 🔹 CONSTRUTORA
    xml += `    <construtora>Direcional Engenharia</construtora>\n`;

    xml += `  </imovel>\n`;
  });

  xml += `</imoveis>`;

  const filePath = path.resolve(
    "src/output",
    "direcional-interior-sp-x09.xml"
  );

  fs.writeFileSync(filePath, xml, "utf8");
  console.log(`📦 XML X09 gerado com sucesso: ${filePath}`);
}

