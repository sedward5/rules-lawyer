export const QUESTION_STATUSES = [
  "draft", "editorial_review", "rules_review",
  "correction_needed", "approved", "rejected"
];

export function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

export function validateQuestion(q) {
  const errors = [];
  if (!q || typeof q !== "object" || Array.isArray(q)) return ["Question must be an object."];
  if (!q.id) errors.push("Missing id.");
  if (!q.category) errors.push("Missing category.");
  if (!["beginner", "intermediate", "advanced"].includes(q.difficulty)) errors.push("Invalid difficulty.");
  if (!q.scenario?.description) errors.push("Missing scenario.description.");
  if (!q.question?.prompt) errors.push("Missing question.prompt.");
  if (!Array.isArray(q.question?.options) || q.question.options.length < 2) errors.push("At least two answer options are required.");
  const ids = (q.question?.options || []).map(o => o.id);
  if (new Set(ids).size !== ids.length) errors.push("Answer option IDs must be unique.");
  if (!ids.includes(q.answer)) errors.push("Correct answer must match an option ID.");
  if (!q.explanation) errors.push("Missing explanation.");
  if (!QUESTION_STATUSES.includes(q.status)) errors.push("Invalid status.");
  if (!["unverified", "needs_expert", "verified"].includes(q.review?.rules)) errors.push("Invalid rules review status.");
  if (!Array.isArray(q.rules) || q.rules.length === 0) errors.push("At least one rules reference is required.");
  if (q.cards && !Array.isArray(q.cards)) errors.push("cards must be an array when supplied.");
  return errors;
}

export function validateBatch(input) {
  const questions = Array.isArray(input) ? input : input?.questions;
  if (!Array.isArray(questions)) throw new Error("Expected a JSON array or an object containing a questions array.");
  const ids = new Set();
  questions.forEach((q, index) => {
    const errors = validateQuestion(q);
    if (ids.has(q?.id)) errors.push("Duplicate question ID in this batch.");
    ids.add(q?.id);
    if (errors.length) throw new Error(`Question ${index + 1}${q?.id ? ` (${q.id})` : ""}: ${errors.join(" ")}`);
  });
  return questions;
}

export function localDateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function dailyIndex(dateKey, count) {
  if (!count) return -1;
  let hash = 2166136261;
  for (const char of dateKey) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % count;
}

export function cardStripMarkup(cards = []) {
  if (!cards.length) return "";
  return `<div class="card-strip" aria-label="Cards in this scenario">${cards.map(card => `
    <figure class="card-figure">
      <a class="card-image-link" data-card-name="${escapeHtml(card.name)}" href="https://scryfall.com/search?q=${encodeURIComponent(card.name)}" target="_blank" rel="noopener noreferrer">
        <div class="card-image-placeholder">${escapeHtml(card.name)}</div>
      </a>
      <figcaption><strong>${escapeHtml(card.name)}</strong><span>${escapeHtml(card.role || "Scenario card")}</span></figcaption>
    </figure>`).join("")}</div>`;
}

export async function hydrateCardImages(container, cards = []) {
  if (!container || !cards.length) return;
  for (const card of cards) {
    const link = [...container.querySelectorAll("[data-card-name]")].find(el => el.dataset.cardName === card.name);
    if (!link) continue;
    try {
      const cacheKey = `rules-lawyer-scryfall-image:${card.name.toLowerCase()}`;
      let data = null;
      try { data = JSON.parse(localStorage.getItem(cacheKey) || "null"); } catch {}
      if (!data?.image) {
        const endpoint = `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(card.name)}`;
        const response = await fetch(endpoint, { headers: { "Accept": "application/json" } });
        if (!response.ok) throw new Error(`Scryfall returned ${response.status}`);
        const result = await response.json();
        const image = result.image_uris?.normal || result.card_faces?.[0]?.image_uris?.normal;
        if (!image) throw new Error("No normal image was supplied for this card.");
        data = { image, page: result.scryfall_uri };
        try { localStorage.setItem(cacheKey, JSON.stringify(data)); } catch {}
      }
      const img = document.createElement("img");
      img.src = data.image;
      img.alt = `${card.name} Magic card`;
      img.loading = "lazy";
      img.decoding = "async";
      link.replaceChildren(img);
      link.href = data.page || `https://scryfall.com/search?q=${encodeURIComponent(card.name)}`;
      link.setAttribute("aria-label", `View ${card.name} on Scryfall`);
    } catch (error) {
      // Keep the readable card-name placeholder if the remote service is unavailable.
      link.title = `Card image unavailable: ${error.message}`;
    }
  }
}
