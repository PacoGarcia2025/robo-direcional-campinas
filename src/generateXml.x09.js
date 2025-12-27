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

export default function generateXmlX09(empreendimentos) {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<empreendimentos>\n`;
  let total = 0;

  empreendimentos.forEach((emp) => {
    if (emp.estado !== "SP") return;
    if (!INTERIOR_SP.includes(emp.cidade)) return;

    const id = emp.id || emp.titulo.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    // 🔹 DESCRIÇÃO CONSOLIDADA (X09 AMA ISSO)
    let descricao = "";

    if (emp.tipologias?.length) {
      const tipos = emp.tipologias
        .map((t) => `${t.dormitorios} dorm • ${t.area}m²`)
        .join(" | ");
      descricao += `Tipologias: ${tipos}. `;
    }

    if (emp.ficha_tecnica) {
      const fichaTxt = Object.entries(emp.ficha_tecnica)
        .map(([k, v]) => `${k}: ${v}`)
        .join(". ");
      descricao += fichaTxt;
    }

    xml += `  <empreendimento>\n`;
    xml += `    <id>${id}</id>\n`;
    xml += `    <titulo><![CDATA[${emp.titulo}]]></titulo>\n`;
    xml += `    <tipo>Apartamento</tipo>\n`;
    xml += `    <cidade>${emp.cidade}</cidade>\n`;
    xml += `    <estado>SP</estado>\n`;
    xml += `    <status><![CDATA[${emp.status || "Lançamento"}]]></status>\n`;
    xml += `    <descricao><![CDATA[${descricao}]]></descricao>\n`;

    // 🔹 FOTOS (OBRIGATÓRIO PELO X09)
    xml += `    <fotos>\n`;
    const imagensValidas = (emp.imagens || []).slice(0, 10);

    if (imagensValidas.length === 0) return;

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
    "direcional-interior-sp-x09.xml"
  );

  fs.writeFileSync(filePath, xml, "utf8");
  console.log(`📦 XML X09 INTERIOR SP gerado: ${total} empreendimentos`);
}
