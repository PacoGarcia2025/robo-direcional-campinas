import fs from "fs";

const inputPath = "src/output/direcional-campinas.json";
const outputPath = "src/output/direcional-campinas.xml";

const data = JSON.parse(fs.readFileSync(inputPath, "utf-8"));

const escapeXml = (str = "") =>
  str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
xml += `<imoveis>\n`;

for (const item of data) {
  const imageMain = item.images?.[0]?.url || "";
  const gallery = item.images?.slice(1) || [];

  xml += `  <imovel>\n`;

  xml += `    <titulo>${escapeXml(item.title)}</titulo>\n`;
  xml += `    <status>${escapeXml(item.status)}</status>\n`;

  xml += `    <localizacao>\n`;
  xml += `      <bairro>${escapeXml(item.location?.neighborhood || "")}</bairro>\n`;
  xml += `      <cidade>${escapeXml(item.location?.city || "")}</cidade>\n`;
  xml += `      <estado>${escapeXml(item.location?.state || "")}</estado>\n`;
  xml += `    </localizacao>\n`;

  if (imageMain) {
    xml += `    <imagem_principal>${escapeXml(imageMain)}</imagem_principal>\n`;
  }

  if (gallery.length) {
    xml += `    <galeria>\n`;
    for (const img of gallery) {
      xml += `      <imagem>${escapeXml(img.url)}</imagem>\n`;
    }
    xml += `    </galeria>\n`;
  }

  if (item.typologies?.length) {
    xml += `    <tipologias>\n`;
    item.typologies.forEach((t) => {
      xml += `      <tipologia>${escapeXml(t)}</tipologia>\n`;
    });
    xml += `    </tipologias>\n`;
  }

  if (item.bedrooms?.length) {
    xml += `    <dormitorios>\n`;
    item.bedrooms.forEach((b) => {
      xml += `      <dormitorio>${escapeXml(b)}</dormitorio>\n`;
    });
    xml += `    </dormitorios>\n`;
  }

  if (item.condo_features?.length) {
    xml += `    <diferenciais>\n`;
    item.condo_features.forEach((f) => {
      xml += `      <diferencial>${escapeXml(f)}</diferencial>\n`;
    });
    xml += `    </diferenciais>\n`;
  }

  xml += `    <url_origem>${escapeXml(item.url)}</url_origem>\n`;

  xml += `  </imovel>\n`;
}

xml += `</imoveis>`;

fs.writeFileSync(outputPath, xml);

console.log("✅ XML gerado com sucesso!");
console.log(`Arquivo: ${outputPath}`);
