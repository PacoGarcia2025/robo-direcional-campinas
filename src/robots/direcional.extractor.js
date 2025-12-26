// =====================================
// DIRECIONAL – EXTRACTOR DEFINITIVO
// - Tipologias com vínculo correto (1↔1)
// - Limpeza pesada de imagens
// =====================================

export async function extractDirecional(page, url) {
  console.log("Extraindo:", url);

  await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });

  const data = await page.evaluate(() => {
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
    // IMAGENS – FILTRO PROFISSIONAL
    // =========================
    const allowedKeywords = [
      "fachada",
      "perspectiva",
      "piscina",
      "living",
      "quarto",
      "suite",
      "cozinha",
      "planta",
      "guarita",
      "lazer",
      "varanda",
      "gourmet",
    ];

    const blockedKeywords = [
      "icon",
      "icone",
      "logo",
      "vector",
      "svg",
      "selo",
      "fgts",
      "renda",
      "parcelas",
      "porcentagem",
      "beneficio",
      "texto",
      "button",
      "background",
      "qualidade",
      "vida",
      "condicoes",
      "pagamento",
      "localizacao",
      "investimento",
      "whats",
      "simul",
    ];

    const images = Array.from(document.querySelectorAll("img"))
      .map(img => img.getAttribute("src") || img.getAttribute("data-src"))
      .filter(src => {
        if (!src) return false;
        if (!src.startsWith("http")) return false;
        if (!src.includes("/wp-content/uploads/")) return false;

        const lower = src.toLowerCase();

        if (blockedKeywords.some(k => lower.includes(k))) return false;
        if (!allowedKeywords.some(k => lower.includes(k))) return false;

        return true;
      });

    const uniqueImages = [...new Set(images)];

    // =========================
    // DORMITÓRIOS & ÁREAS (TEXTO)
    // =========================
    const spans = Array.from(
      document.querySelectorAll("ul.pl-3 span")
    ).map(s => s.innerText);

    let dormitorios = [];
    let areas = [];

    spans.forEach(txt => {
      const dorms = txt.match(/\d+\s*(?=quartos?)/gi);
      if (dorms) {
        dorms.forEach(d =>
          dormitorios.push(Number(d.replace(/\D/g, "")))
        );
      }

      const areaMatches = txt.match(/\d{2,3}[,.]?\d*\s?m²/gi);
      if (areaMatches) {
        areaMatches.forEach(a => areas.push(a));
      }
    });

    dormitorios = [...new Set(dormitorios)];
    areas = [...new Set(areas)];

    // =========================
    // UNIDADES – VÍNCULO 1↔1
    // =========================
    const unidades = [];
    const max = Math.min(dormitorios.length, areas.length);

    for (let i = 0; i < max; i++) {
      unidades.push({
        dormitorios: dormitorios[i],
        area: areas[i]
          .replace("m²", "")
          .replace(",", ".")
          .trim(),
      });
    }

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
