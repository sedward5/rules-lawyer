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
  // Stable deterministic hash: every visitor gets the same selection for a UTC date.
  let hash = 2166136261;
  for (const char of dateKey) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % count;
}
