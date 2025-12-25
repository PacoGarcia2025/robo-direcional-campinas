// =====================================
// DIRECIONAL – EXTRACTOR COM LIMPEZA
// =====================================

export async function extractDirecional(page, url) {
  console.log("Extraindo:", url);

  await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });

  const data = await page.evaluate(() => {
    // =========================
    // FUNÇÃO AUXILIAR
    // =========================
    const getText = sel =>
      document.querySelector(sel)?.innerText.trim() || "";

    // =========================
    // FILTRO DE IMAGENS REAIS
    // =========================
    const images = Array.from(document.querySelectorAll("img"))
      .map(img => img.getAttribute("src") || img.getAttribute("data-src"))
      .filter(src => {
        if (!src) return false;
        if (!src.startsWith("http")) return false;

        const blocked = [
          "button",
          "background",
          "icon",
          "logo",
          "vector",
          "svg",
          "whats",
          "simul",
          "placeholder",
          "loading",
        ];

        if (blocked.some(word => src.toLowerCase().includes(word))) {
          return false;
        }

        // só imagens reais do WordPress
        return src.includes("/wp-content/uploads/");
      });

    // remove duplicadas
    const uniqueImages = [...new Set(images)];

    // =========================
    // STATUS (CARD FIXO)
    // =========================
    const fixedCardText =
      document.querySelector("#card-simulacao-empreendimento li")
        ?.innerText.trim() || "";

    // =========================
    // LOCALIZAÇÃO
    // =========================
    const rawLocation = getText("#card-simulacao-empreendimento .adress a");

    let city = "";
    let state = "";

    if (rawLocation.includes("-")) {
      const parts = rawLocation.split("-");
      state = parts.pop()?.trim();
      city = parts.pop()?.split(",")?.pop()?.trim() || "";
    }

    return {
      title: document.querySelector("h1")?.innerText.trim() || "",
      location: {
        raw: rawLocation,
        city,
        state,
      },
      images: uniqueImages,
      fixedCardText,
    };
  });

  return {
    id: url.split("/").filter(Boolean).pop(),
    url,
    ...data,
  };
}
