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
  return `<div class="card-strip" aria-label="Cards in this scenario">${cards.map((card, index) => `
    <figure class="card-figure">
      <a class="card-image-link" data-card-index="${index}" href="https://scryfall.com/search?q=${encodeURIComponent(card.name)}" target="_blank" rel="noopener noreferrer">
        <div class="card-image-placeholder">${escapeHtml(card.name)}</div>
      </a>
      <figcaption><strong data-card-caption="${index}">${escapeHtml(card.name)}</strong><span>${escapeHtml(card.role || "Scenario card")}</span></figcaption>
    </figure>`).join("")}</div>`;
}

export async function hydrateCardImages(container, cards = []) {
  if (!container || !cards.length) return;
  const cache = new Map();
  for (const [index, card] of cards.entries()) {
    const link = container.querySelector(`[data-card-index="${index}"]`);
    if (!link) continue;
    try {
      const query = card.scryfallQuery;
      const cacheKey = `rules-lawyer-scryfall-image:${(query || card.name).toLowerCase()}`;
      let data = cache.get(cacheKey);
      if (!data) {
        try { data = JSON.parse(localStorage.getItem(cacheKey) || "null"); } catch {}
        if (!data?.image) {
          const endpoint = query
            ? `https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}&order=edhrec&unique=cards`
            : `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(card.name)}`;
          const response = await fetch(endpoint, { headers: { "Accept": "application/json" } });
          if (!response.ok) throw new Error(`Scryfall returned ${response.status}`);
          const result = await response.json();
          const selected = query ? result.data?.[0] : result;
          if (!selected) throw new Error("Scryfall did not return a matching card.");
          const actualName = selected.name;
          const image = selected.image_uris?.normal || selected.card_faces?.[0]?.image_uris?.normal;
          if (!image) throw new Error("No normal image was supplied for this card.");
          data = { image, page: selected.scryfall_uri, name: actualName };
          try { localStorage.setItem(cacheKey, JSON.stringify(data)); } catch {}
        }
        cache.set(cacheKey, data);
      }
      const img = document.createElement("img");
      img.src = data.image;
      img.alt = `${data.name || card.name} Magic card`;
      img.loading = "lazy";
      img.decoding = "async";
      link.replaceChildren(img);
      link.href = data.page || `https://scryfall.com/search?q=${encodeURIComponent(data.name || card.name)}`;
      link.setAttribute("aria-label", `View ${data.name || card.name} on Scryfall`);
      const caption = container.querySelector(`[data-card-caption="${index}"]`);
      if (caption && query) caption.textContent = data.name;
    } catch (error) {
      link.title = `Card image unavailable: ${error.message}`;
    }
  }
}
