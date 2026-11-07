import { escapeHtml, validateBatch, cardStripMarkup, hydrateCardImages } from "./common.js";

const $ = selector => document.querySelector(selector);
const STORAGE_KEY = "rules-lawyer-workshop-draft-v1";
let questions = [];
let selectedId = null;

const fields = {
  id: "#edit-id", category: "#edit-category", difficulty: "#edit-difficulty",
  format: "#edit-format", scenario: "#edit-scenario", prompt: "#edit-prompt",
  answer: "#edit-answer", explanation: "#edit-explanation", takeaway: "#edit-takeaway",
  rules: "#edit-rules", status: "#edit-status", verification: "#edit-verification",
  notes: "#edit-notes"
};

function statusLabel(status) {
  return (status || "draft").replaceAll("_", " ");
}
function selectedQuestion() {
  return questions.find(q => q.id === selectedId);
}
function updateCounts() {
  $("#count-total").textContent = questions.length;
  $("#count-approved").textContent = questions.filter(q => q.status === "approved" && q.review?.rules === "verified").length;
  $("#count-review").textContent = questions.filter(q => q.status !== "approved" || q.review?.rules !== "verified").length;
}
function renderQueue() {
  const select = $("#question-select");
  select.innerHTML = questions.map(q =>
    `<option value="${escapeHtml(q.id)}">${escapeHtml(q.id)} — ${escapeHtml(q.title || q.category)} · ${escapeHtml(statusLabel(q.status))}</option>`
  ).join("");
  if (selectedId && questions.some(q => q.id === selectedId)) select.value = selectedId;
  else selectedId = questions[0]?.id || null;
  select.value = selectedId || "";
  updateCounts();
  renderReview();
}
async function renderReview() {
  const q = selectedQuestion();
  const card = $("#review-card");
  $("#editor-panel").hidden = !q;
  $("#preview-panel").hidden = !q;
  if (!q) {
    card.className = "review-card empty";
    card.textContent = "Import a question batch to begin.";
    return;
  }
  const options = q.question.options.map(o =>
    `<div class="answer-option ${o.id === q.answer ? "correct" : ""}"><strong>${escapeHtml(o.id.toUpperCase())}.</strong><span>${escapeHtml(o.text)} ${o.id === q.answer ? "<b>· Proposed answer</b>" : ""}</span></div>`
  ).join("");
  card.className = "review-card";
  card.innerHTML = `
    <div class="pills"><span class="pill">${escapeHtml(q.category)}</span><span class="pill">${escapeHtml(q.difficulty)}</span><span class="pill">${escapeHtml(q.scenario.format || "format unspecified")}</span></div>
    <h3>${escapeHtml(q.title || q.id)}</h3>
    ${cardStripMarkup(q.cards || [])}
    <p>${escapeHtml(q.scenario.description)}</p>
    <strong>${escapeHtml(q.question.prompt)}</strong>
    <div class="answer-list">${options}</div>
    <div><strong>Proposed explanation</strong><p>${escapeHtml(q.explanation)}</p></div>
    <div><strong>Rules references</strong><p>${(q.rules || []).map(escapeHtml).join(", ")}</p></div>
    <p class="status ${escapeHtml(q.status)}"><strong>Content:</strong> ${escapeHtml(statusLabel(q.status))} · <strong>Rules:</strong> ${escapeHtml(q.review?.rules || "unverified")}</p>
    <div><strong>Editorial briefing</strong><p>${escapeHtml(q.editorial?.intent || "No learning objective supplied.")}</p><p>${escapeHtml(q.editorial?.review_focus || "Check clarity, assumptions, answer uniqueness, and explanation quality.")}</p></div>`;
  await hydrateCardImages(card, q.cards || []);
  populateEditor(q);
  await renderPreview(q);
}
function populateEditor(q) {
  const values = {
    id: q.id, category: q.category, difficulty: q.difficulty,
    format: q.scenario.format || "", scenario: q.scenario.description,
    prompt: q.question.prompt, answer: q.answer, explanation: q.explanation,
    takeaway: q.takeaway || "", rules: (q.rules || []).join("\n"),
    status: q.status, verification: q.review?.rules || "unverified",
    notes: q.review?.notes || ""
  };
  Object.entries(fields).forEach(([key, selector]) => { $(selector).value = values[key] ?? ""; });
  $("#answer-fields").innerHTML = q.question.options.map((o, i) => `
    <label>Answer option ${o.id.toUpperCase()}
      <textarea rows="2" data-option-index="${i}">${escapeHtml(o.text)}</textarea>
    </label>`).join("");
  $("#edit-answer").innerHTML = q.question.options.map(o =>
    `<option value="${escapeHtml(o.id)}">${escapeHtml(o.id.toUpperCase())}</option>`
  ).join("");
  $("#edit-answer").value = q.answer;
}
function readEditor() {
  const q = selectedQuestion();
  if (!q) return;
  q.id = $("#edit-id").value.trim();
  q.category = $("#edit-category").value.trim();
  q.difficulty = $("#edit-difficulty").value;
  q.scenario.format = $("#edit-format").value.trim();
  q.scenario.description = $("#edit-scenario").value.trim();
  q.question.prompt = $("#edit-prompt").value.trim();
  q.question.options.forEach((option, i) => {
    const input = document.querySelector(`[data-option-index="${i}"]`);
    if (input) option.text = input.value.trim();
  });
  q.answer = $("#edit-answer").value;
  q.explanation = $("#edit-explanation").value.trim();
  q.takeaway = $("#edit-takeaway").value.trim();
  q.rules = $("#edit-rules").value.split("\n").map(s => s.trim()).filter(Boolean);
  q.status = $("#edit-status").value;
  q.review = q.review || {};
  q.review.rules = $("#edit-verification").value;
  q.review.notes = $("#edit-notes").value.trim();
  if (q.id !== selectedId && questions.some(other => other.id === q.id)) {
    throw new Error("That question ID is already in this batch.");
  }
  selectedId = q.id;
}
async function renderPreview(q) {
  const options = q.question.options.map(o =>
    `<div class="answer-option ${o.id === q.answer ? "correct" : ""}"><strong>${escapeHtml(o.id.toUpperCase())}.</strong><span>${escapeHtml(o.text)}</span></div>`
  ).join("");
  $("#player-preview").innerHTML = `
    <div class="pills"><span class="pill">${escapeHtml(q.category)}</span><span class="pill">${escapeHtml(q.difficulty)}</span></div>
    <h3>${escapeHtml(q.title || "What happens next?")}</h3>
    ${cardStripMarkup(q.cards || [])}
    <p>${escapeHtml(q.scenario.description)}</p>
    <strong>${escapeHtml(q.question.prompt)}</strong>
    <div class="answer-list">${options}</div>
    <div class="feedback"><strong>Answer key preview: ${escapeHtml(q.answer.toUpperCase())}</strong><p>${escapeHtml(q.explanation)}</p><p><strong>References:</strong> ${q.rules.map(escapeHtml).join(", ")}</p></div>`;
  await hydrateCardImages($("#player-preview"), q.cards || []);
}
function persistDraft() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ questions, selectedId })); }
  catch { /* Browser storage is a convenience, never the source of truth. */ }
}
function importQuestions(raw) {
  const parsed = JSON.parse(raw);
  questions = validateBatch(parsed).map(q => structuredClone(q));
  selectedId = questions[0]?.id || null;
  persistDraft();
  renderQueue();
}
async function loadExample() {
  const manifestResponse = await fetch("./content/manifest.json");
  if (!manifestResponse.ok) throw new Error("Could not load the question manifest.");
  const manifest = await manifestResponse.json();
  if (!Array.isArray(manifest.batches) || manifest.batches.length === 0) {
    throw new Error("The question manifest does not contain any batches.");
  }

  const batchResponses = await Promise.all(manifest.batches.map(path => fetch(`./content/${path}`)));
  const failedIndex = batchResponses.findIndex(response => !response.ok);
  if (failedIndex !== -1) {
    throw new Error(`Could not load question batch: ${manifest.batches[failedIndex]}`);
  }

  const batchDocuments = await Promise.all(batchResponses.map(response => response.json()));
  const allQuestions = batchDocuments.flatMap(batch => Array.isArray(batch) ? batch : batch.questions || []);
  if (allQuestions.length === 0) throw new Error("The manifest batches did not contain any questions.");
  // Keep local edits, but never let an old one-question draft hide the rest of the manifest.
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"); } catch {}
  const savedById = new Map((saved?.questions || []).map(q => [q.id, q]));
  const merged = allQuestions.map(q => savedById.get(q.id) || q);
  const knownIds = new Set(merged.map(q => q.id));
  for (const q of saved?.questions || []) if (!knownIds.has(q.id)) merged.push(q);
  questions = validateBatch(merged).map(q => structuredClone(q));
  selectedId = questions[0]?.id || null;
  persistDraft();
  renderQueue();
}
$("#import-button").addEventListener("click", () => {
  try {
    importQuestions($("#import-json").value);
    $("#import-message").textContent = `Imported ${questions.length} question(s).`;
  } catch (error) { $("#import-message").textContent = `Import failed: ${error.message}`; }
});
$("#load-example").addEventListener("click", async () => {
  try {
    await loadExample();
    $("#import-message").textContent = `Loaded ${questions.length} curated questions.`;
  } catch (error) { $("#import-message").textContent = error.message; }
});
$("#question-select").addEventListener("change", event => {
  try { readEditor(); } catch (error) { $("#edit-message").textContent = error.message; return; }
  selectedId = event.target.value;
  persistDraft();
  renderReview();
});
$("#save-edit").addEventListener("click", () => {
  try {
    readEditor();
    validateBatch(questions);
    persistDraft();
    renderQueue();
    $("#edit-message").textContent = "Local draft saved. Export the batch to update the repository.";
  } catch (error) { $("#edit-message").textContent = `Please fix: ${error.message}`; }
});
$("#copy-review").addEventListener("click", async () => {
  try {
    readEditor();
    const q = selectedQuestion();
    const text = `Rules Lawyer review: ${q.id}\nDecision/status: ${q.status}\nRules verification: ${q.review.rules}\nNotes: ${q.review.notes || "(none)"}`;
    await navigator.clipboard.writeText(text);
    $("#edit-message").textContent = "Review notes copied.";
  } catch (error) { $("#edit-message").textContent = `Could not copy: ${error.message}`; }
});
$("#export-button").addEventListener("click", async () => {
  try {
    if (selectedQuestion()) readEditor();
    validateBatch(questions);
    const output = JSON.stringify({ questions }, null, 2);
    await navigator.clipboard.writeText(output);
    const blob = new Blob([output], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rules-lawyer-question-batch.json";
    a.click();
    URL.revokeObjectURL(url);
    persistDraft();
    $("#import-message").textContent = "Batch validated, copied, and downloaded. Commit this JSON to the repository.";
    updateCounts();
  } catch (error) { $("#import-message").textContent = `Export failed: ${error.message}`; }
});

try {
  // Always load every manifest batch first. loadExample overlays saved edits by ID,
  // so an old one-question local draft cannot collapse the Workshop queue.
  await loadExample();
  $("#import-message").textContent = `Loaded ${questions.length} questions, including any saved local edits.`;
} catch (error) {
  $("#import-message").textContent = `Could not load the question library: ${error.message}`;
}
