export async function extractDirecionalPremium(page, url) {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });

  return await page.evaluate(() => {
    const clean = (txt) => txt?.replace(/\s+/g, " ").trim() || null;

    /* =========================
       TÍTULO
    ========================== */
    const title = clean(document.querySelector("h1")?.innerText);

    /* =========================
       LOCALIZAÇÃO (bairro / cidade / estado)
       Fonte confiável: link #maps do card lateral
    ========================== */
    let neighborhood = null;
    let city = null;
    let state = null;

    const locationEl = document.querySelector('#card-simulacao-empreendimento a[href="#maps"]')
      || document.querySelector('a[href="#maps"]');

    if (locationEl) {
      // Ex.: "Região do Parque Prado , Campinas - SP"
      const txt = locationEl.innerText;
      const [left, uf] = txt.split("-").map(s => s.trim());
      state = uf || null;

      const parts = left.split(",").map(s => s.trim());
      neighborhood = parts[0] || null;
      city = parts[1] || null;
    }

    /* =========================
       STATUS REAL (REGRA DEFINITIVA)
       1) Card lateral fixo (único e confiável)
       2) Fallback: bloco status-empreendimento (lógica visual)
       3) Indefinido
    ========================== */
    let status = null;

    // 1) Card lateral fixo
    const sideStatus = document.querySelector(
      "#card-simulacao-empreendimento ul li"
    );
    if (sideStatus) {
      status = clean(sideStatus.innerText);
    }

    // 2) Fallback: bloco status-empreendimento (visual)
    if (!status) {
      document
        .querySelectorAll(".status-empreendimento .row")
        .forEach((row) => {
          const p = row.querySelector("p");
          const img = row.querySelector("img");
          if (!p || !img) return;

          // ignora cinza (não ativo)
          if (p.classList.contains("text-status-gray")) return;

          const src = img.getAttribute("src") || img.getAttribute("data-src") || "";
          // ignora ícones genéricos de progresso
          if (src.includes("in-progress")) return;

          status = clean(p.innerText);
        });
    }

    if (!status) status = "Indefinido";

    /* =========================
       TIPOLOGIAS (m²) — SOMENTE TEXTO ESTRUTURADO
    ========================== */
    const typologies = [];
    document.querySelectorAll(".content-title ul span").forEach((el) => {
      const t = el.innerText || "";
      if (t.includes("m²")) {
        t.split("|").forEach((p) => typologies.push(clean(p)));
      }
    });

    /* =========================
       DORMITÓRIOS — SOMENTE TEXTO ESTRUTURADO
    ========================== */
    const bedrooms = [];
    document.querySelectorAll(".content-title ul span").forEach((el) => {
      const t = (el.innerText || "").toLowerCase();
      if (t.includes("quarto")) bedrooms.push(clean(el.innerText));
    });

    /* =========================
       DIFERENCIAIS DO CONDOMÍNIO
       Fonte oficial: .competitive-edges h3
    ========================== */
    const condo_features = [];
    document.querySelectorAll(".competitive-edges h3").forEach((el) => {
      const t = clean(el.innerText);
      if (t) condo_features.push(t);
    });

    /* =========================
       IMAGENS PREMIUM
       Regras:
       - <picture> img
       - largura >= 1000
       - alt confiável (empreendimento / fachada / perspectiva / lazer)
       - ignora ícones/botões/logos
    ========================== */
    const images = [];

    document.querySelectorAll("picture img").forEach((img) => {
      const src =
        img.getAttribute("data-src") ||
        img.getAttribute("src") ||
        "";

      if (!src) return;

      const alt = (img.getAttribute("alt") || "").toLowerCase();
      const width = parseInt(img.getAttribute("data-eio-rwidth") || "0", 10);
      const lowerSrc = src.toLowerCase();

      // filtros negativos
      if (
        lowerSrc.includes("icon") ||
        lowerSrc.includes("logo") ||
        lowerSrc.includes("button") ||
        lowerSrc.includes("whats")
      ) return;

      // qualidade mínima
      if (width && width < 1000) return;

      // alt confiável (sinais fortes)
      const altOk =
        alt.includes("empreendimento") ||
        alt.includes("fachada") ||
        alt.includes("perspectiva") ||
        alt.includes("lazer");

      if (!altOk) return;

      images.push({
        url: src,
        alt: img.getAttribute("alt") || null,
        width: width || null
      });
    });

    return {
      title,
      location: { neighborhood, city, state },
      status,
      typologies: [...new Set(typologies)].filter(Boolean),
      bedrooms: [...new Set(bedrooms)].filter(Boolean),
      condo_features: [...new Set(condo_features)].filter(Boolean),
      images
    };
  });
}
