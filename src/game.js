import { escapeHtml, dailyIndex, localDateKey } from "./common.js";

const game = document.querySelector("#game");
const dateKey = localDateKey();
document.querySelector("#puzzle-date").textContent = `DAILY CHALLENGE · ${dateKey}`;

async function loadQuestions() {
  const manifestResponse = await fetch("./content/manifest.json");
  if (!manifestResponse.ok) throw new Error("Could not load the question manifest.");
  const manifest = await manifestResponse.json();
  const batches = await Promise.all(manifest.batches.map(async path => {
    const response = await fetch(`./content/${path}`);
    if (!response.ok) throw new Error(`Could not load ${path}`);
    return response.json();
  }));
  return batches.flatMap(batch => batch.questions || batch);
}

function renderQuestion(q) {
  const options = q.question.options.map(option => `
    <label class="choice">
      <input type="radio" name="answer" value="${escapeHtml(option.id)}">
      <span><strong>${escapeHtml(option.id.toUpperCase())}.</strong> ${escapeHtml(option.text)}</span>
    </label>`).join("");

  game.innerHTML = `
    <div class="stack">
      <div class="pills">
        <span class="pill">${escapeHtml(q.category)}</span>
        <span class="pill">${escapeHtml(q.difficulty)}</span>
      </div>
      <h2>${escapeHtml(q.title || "What happens next?")}</h2>
      <p>${escapeHtml(q.scenario.description)}</p>
      <h3>${escapeHtml(q.question.prompt)}</h3>
      <form id="answer-form" class="stack">
        <div class="answer-list">${options}</div>
        <button class="button primary" type="submit">Lock in answer</button>
      </form>
      <div id="result" aria-live="polite"></div>
    </div>`;

  document.querySelector("#answer-form").addEventListener("submit", event => {
    event.preventDefault();
    const selected = new FormData(event.currentTarget).get("answer");
    if (!selected) return;
    const correct = selected === q.answer;
    const result = document.querySelector("#result");
    result.innerHTML = `
      <div class="feedback ${correct ? "correct" : "incorrect"}">
        <strong>${correct ? "Correct ruling." : "Not quite."}</strong>
        <p>${escapeHtml(q.explanation)}</p>
        ${q.takeaway ? `<p><strong>Learning takeaway:</strong> ${escapeHtml(q.takeaway)}</p>` : ""}
        <p><strong>Rules references:</strong> ${q.rules.map(escapeHtml).join(", ")}</p>
      </div>`;
    document.querySelectorAll('input[name="answer"]').forEach(input => input.disabled = true);
    event.currentTarget.querySelector("button").disabled = true;
  });
}

try {
  const questions = (await loadQuestions())
    .filter(q => q.status === "approved" && q.review?.rules === "verified")
    .sort((a, b) => a.id.localeCompare(b.id));
  if (!questions.length) throw new Error("No approved, rules-verified questions are available yet.");
  const index = dailyIndex(dateKey, questions.length);
  renderQuestion(questions[index]);
} catch (error) {
  game.innerHTML = `<div class="feedback"><strong>Today's puzzle isn't available yet.</strong><p>${escapeHtml(error.message)}</p><p>The content library may still be in setup. Visit the Workshop to review the starter question.</p></div>`;
}
