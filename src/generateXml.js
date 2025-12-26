import fs from "fs";

export default function generateXml(data, outputPath) {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<empreendimentos>\n`;

  for (const emp of data) {
    xml += `  <empreendimento>\n`;
    xml += `    <id>${emp.id}</id>\n`;
    xml += `    <titulo><![CDATA[${emp.titulo}]]></titulo>\n`;
    xml += `    <cidade>${emp.cidade}</cidade>\n`;
    xml += `    <estado>${emp.estado}</estado>\n`;
    xml += `    <status>${emp.status}</status>\n`;

    if (emp.unidades.length) {
      xml += `    <unidades>\n`;
      for (const u of emp.unidades) {
        xml += `      <unidade>\n`;
        xml += `        <dormitorios>${u.dormitorios}</dormitorios>\n`;
        if (u.area_min) xml += `        <area_min>${u.area_min}</area_min>\n`;
        if (u.area_max) xml += `        <area_max>${u.area_max}</area_max>\n`;
        xml += `      </unidade>\n`;
      }
      xml += `    </unidades>\n`;
    }

    if (emp.diferenciais.length) {
      xml += `    <diferenciais_empreendimento>\n`;
      emp.diferenciais.forEach(d =>
        xml += `      <item><![CDATA[${d}]]></item>\n`
      );
      xml += `    </diferenciais_empreendimento>\n`;
    }

    if (emp.fotos.length) {
      xml += `    <fotos>\n`;
      emp.fotos.forEach(f =>
        xml += `      <foto>${f}</foto>\n`
      );
      xml += `    </fotos>\n`;
    }

    xml += `  </empreendimento>\n`;
  }

  xml += `</empreendimentos>`;
  fs.writeFileSync(outputPath, xml, "utf-8");
}
