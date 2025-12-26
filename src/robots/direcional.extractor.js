// =====================================
// DIRECIONAL – EXTRACTOR PREMIUM (HTML)
// MODELO A – UNIDADES ESTRUTURADAS
// =====================================

export async function extractDirecional(page, url) {
  console.log("Extraindo:", url);

  await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });

  const data = await page.evaluate(() => {
    // =========================
    // AUXILIARES
    // =========================
    const text = sel =>
      document.querySelector(sel)?.innerText.trim() || "";

    // =========================
    // TÍTULO
    // =========================
    const title = document.querySelector("h1")?.innerText.trim() || "";

    // =========================
    // LOCALIZAÇÃO
    // =========================
    const rawLocation = text("#card-simulacao-empreendimento .adress a");

    let city = "";
    let state = "";

    if (rawLocation.includes("-")) {
      const parts = rawLocation.split("-");
      state = parts.pop()?.trim();
      city = parts.pop()?.split(",")?.pop()?.trim() || "";
    }

    // =========================
    // STATUS
    // =========================
    const fixedCardText =
      document.querySelector("#card-simulacao-empreendimento li")
        ?.innerText.trim() || "";

    // =========================
    // IMAGENS (JÁ LIMPAS)
    // =========================
    const images = Array.from(document.querySelectorAll("img"))
      .map(img => img.getAttribute("src") || img.getAttribute("data-src"))
      .filter(src => {
        if (!src) return false;
        if (!src.startsWith("http")) return false;
        if (!src.includes("/wp-content/uploads/")) return false;

        const blocked = [
          "button",
          "background",
          "icon",
          "logo",
          "vector",
          "svg",
          "whats",
          "simul",
        ];

        return !blocked.some(w => src.toLowerCase().includes(w));
      });

    const uniqueImages = [...new Set(images)];

    // =========================
    // DORMITÓRIOS + TIPOLOGIAS
    // =========================
    const spans = Array.from(
      document.querySelectorAll("ul.pl-3 span")
    ).map(s => s.innerText);

    let dormitorios = [];
    let areas = [];

    spans.forEach(txt => {
      // 1 e 2 Quartos
      const dormMatch = txt.match(/(\d+)\s*e\s*(\d+)\s*quartos/i);
      if (dormMatch) {
        dormitorios.push(Number(dormMatch[1]));
        dormitorios.push(Number(dormMatch[2]));
      }

      // 40,77m² | 50,79m²
      const areaMatches = txt.match(/\d{2,3}[,.]?\d*\s?m²/gi);
      if (areaMatches) {
        areaMatches.forEach(a => areas.push(a));
      }
    });

    dormitorios = [...new Set(dormitorios)];
    areas = [...new Set(areas)];

    // =========================
    // UNIDADES (MODELO A)
    // =========================
    const unidades = [];

    dormitorios.forEach(d => {
      areas.forEach(a => {
        unidades.push({
          dormitorios: d,
          area: a.replace("m²", "").replace(",", ".").trim(),
        });
      });
    });

    // =========================
    // DIFERENCIAIS DO CONDOMÍNIO
    // =========================
    const diferenciais = Array.from(
      document.querySelectorAll(".card-single h3")
    ).map(h3 => h3.innerText.trim());

    return {
      title,
      location: {
        raw: rawLocation,
        city,
        state,
      },
      fixedCardText,
      images: uniqueImages,
      unidades,
      diferenciais,
    };
  });

  return {
    id: url.split("/").filter(Boolean).pop(),
    url,
    ...data,
  };
}
