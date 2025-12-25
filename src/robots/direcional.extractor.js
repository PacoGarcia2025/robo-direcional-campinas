// ============================================
// DIRECIONAL – EXTRACTOR COMPLETO (DEFINITIVO)
// ============================================

export async function extractDirecional(page, url) {
  console.log("Extraindo:", url);

  await page.goto(url, {
    waitUntil: "networkidle",
    timeout: 60000,
  });

  const data = await page.evaluate(() => {
    const text = sel =>
      document.querySelector(sel)?.innerText.trim() || "";

    // -------------------------
    // TÍTULO
    // -------------------------
    const title = document.querySelector("h1")?.innerText.trim() || "";

    // -------------------------
    // LOCALIZAÇÃO
    // -------------------------
    let city = "";
    let state = "";
    let rawLocation = "";

    const addressEl = document.querySelector(
      "#card-simulacao-empreendimento a[href='#maps']"
    );

    if (addressEl) {
      rawLocation = addressEl.innerText.trim();
      const parts = rawLocation.split(",");
      const cityState = parts[parts.length - 1] || "";
      const [c, s] = cityState.split("-").map(v => v?.trim());
      city = c || "";
      state = s || "";
    }

    // -------------------------
    // STATUS DA OBRA
    // -------------------------
    const fixedCardText =
      document.querySelector("#card-simulacao-empreendimento li")
        ?.innerText.trim() || "";

    // -------------------------
    // DESCRIÇÃO (SOBRE O EMPREENDIMENTO)
    // -------------------------
    const description =
      document.querySelector(".about-us .text p")?.innerText.trim() || "";

    // -------------------------
    // TIPOGRAFIAS (m²)
    // -------------------------
    const tipologias = new Set();

    document.querySelectorAll("li span").forEach(span => {
      const txt = span.innerText;
      if (txt && txt.includes("m²")) {
        txt.split("|").forEach(v => {
          const clean = v.replace(",", ".").replace(/[^0-9.]/g, "").trim();
          if (clean) tipologias.add(`${clean} m²`);
        });
      }
    });

    // -------------------------
    // DORMITÓRIOS
    // -------------------------
    const dormitorios = new Set();

    document.querySelectorAll("li span").forEach(span => {
      const txt = span.innerText;
      if (txt && txt.toLowerCase().includes("quarto")) {
        txt
          .replace(/[^0-9 e]/gi, "")
          .split("e")
          .forEach(n => {
            const num = n.trim();
            if (num) dormitorios.add(num);
          });
      }
    });

    // -------------------------
    // DIFERENCIAIS DO CONDOMÍNIO
    // -------------------------
    const diferenciaisEmpreendimento = new Set();

    document
      .querySelectorAll("h2")
      .forEach(h2 => {
        if (h2.innerText.includes("Diferenciais do Condomínio")) {
          h2
            .closest("div")
            ?.querySelectorAll(".card-single h3")
            .forEach(h3 => {
              if (h3.innerText) {
                diferenciaisEmpreendimento.add(h3.innerText.trim());
              }
            });
        }
      });

    // -------------------------
    // DIFERENCIAIS DA UNIDADE (heurística)
    // -------------------------
    const diferenciaisUnidade = new Set();

    const unitKeywords = [
      "varanda",
      "suíte",
      "ar-condicionado",
      "opções na planta",
      "elevador",
    ];

    document.querySelectorAll("span, p, h3").forEach(el => {
      const txt = el.innerText?.toLowerCase() || "";
      unitKeywords.forEach(k => {
        if (txt.includes(k)) {
          diferenciaisUnidade.add(k);
        }
      });
    });

    // -------------------------
    // IMAGENS (FILTRADAS)
    // -------------------------
    const images = new Set();

    document.querySelectorAll("img").forEach(img => {
      const src =
        img.getAttribute("data-src") ||
        img.getAttribute("src") ||
        "";

      if (
        src.startsWith("http") &&
        !src.includes("icon") &&
        !src.includes("logo") &&
        !src.includes("vector") &&
        !src.includes("base64") &&
        !src.includes("theme")
      ) {
        images.add(src);
      }
    });

    return {
      title,
      location: {
        raw: rawLocation,
        city,
        state,
      },
      fixedCardText,
      description,
      dormitorios: Array.from(dormitorios),
      tipologias: Array.from(tipologias),
      diferenciais_unidade: Array.from(diferenciaisUnidade),
      diferenciais_empreendimento: Array.from(diferenciaisEmpreendimento),
      images: Array.from(images),
    };
  });

  return {
    id: url.split("/").filter(Boolean).pop(),
    url,
    ...data,
  };
}
