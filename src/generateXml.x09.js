import fs from "fs";
import path from "path";

const INTERIOR_SP = [
  "Campinas",
  "Ribeirão Preto",
  "Sorocaba",
  "Limeira",
  "Araraquara",
  "São Carlos",
  "Piracicaba",
  "Americana",
  "Indaiatuba",
  "Hortolândia",
  "Sumaré",
  "Jundiaí",
];

export default function generateXmlX09(
  empreendimentos,
  prefix = "direcional"
) {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<empreendimentos>\n`;
  let total = 0;

  empreendimentos.forEach((emp) => {
    if (emp.estado !== "SP") return;
    if (!INTERIOR_SP.includes(emp.cidade)) return;

    const id =
      emp.id || emp.titulo?.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    // 🔹 DESCRIÇÃO CONSOLIDADA
    let descricao = "";

    if (emp.tipologias?.length) {
      const tipos = emp.tipologias
        .map((t) => `${t.dormitorios} dorm • ${t.area}m²`)
        .join(" | ");
      descricao += `Tipologias: ${tipos}. `;
    }

    xml += `  <empreendimento>\n`;
    xml += `    <id>${id}</id>\n`;
    xml += `    <titulo><![CDATA[${emp.titulo || ""}]]></titulo>\n`;
    xml += `    <tipo>Apartamento</tipo>\n`;
    xml += `    <cidade>${emp.cidade}</cidade>\n`;
    xml += `    <estado>SP</estado>\n`;
    xml += `    <status><![CDATA[${emp.status || "Lançamento"}]]></status>\n`;
    xml += `    <descricao><![CDATA[${descricao}]]></descricao>\n`;

    // 🔹 FOTOS (obrigatório X09)
    const imagensValidas = (emp.imagens || []).slice(0, 10);
    if (imagensValidas.length === 0) return;

    xml += `    <fotos>\n`;
    imagensValidas.forEach((img) => {
      xml += `      <foto><![CDATA[${img}]]></foto>\n`;
    });
    xml += `    </fotos>\n`;

    xml += `  </empreendimento>\n`;
    total++;
  });

  xml += `</empreendimentos>`;

  const filePath = path.resolve(
    "src/output",
    `${prefix}-interior-sp-x09.xml`
  );

  fs.writeFileSync(filePath, xml, "utf8");
  console.log(
    `📦 XML X09 INTERIOR SP gerado (${prefix}): ${total} empreendimentos`
  );
}
