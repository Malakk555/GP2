const grid = document.getElementById("trackedGrid");

function card(game) {
  const isNew = game.analysis_status === "no_comments" || Number(game.comments_count || 0) === 0;
const riskClass = isNew ? "new-pill" : `risk-${String(game.overall_risk_level || "Low").toLowerCase()}`;
  return `
    <article class="card">
      <div class="top-pills">
  ${isNew ? "" : `<span class="pill">${game.overall_risk_percent ?? 0}% Risk</span>`}
  <span class="pill ${riskClass}">
    ${isNew ? "New" : (game.overall_risk_level ?? "Low")}
  </span>
</div>

      ${game.image_url 
  ? `<img class="thumb" src="${game.image_url}" alt="${game.game_name}">`
  : `<div class="thumb placeholder"></div>`
}

      <h3>${game.game_name}</h3>
      <p class="mini">${game.description ?? ""}</p>

      <div class="tags">
  ${(game.genre || "")
    .split(",")
    .map(g => `<span class="tag">${g.trim()}</span>`)
    .join("")}
</div>

      

      <div class="cardActions">
  <a class="btn" href="game-details.html?game_id=${game.game_id}">
    View Details
  </a>

  <button class="btn" onclick="untrackGame(${game.game_id})">
  Untrack
</button>
</div>
    </article>
  `;
}

async function loadTracked() {
  const res = await fetch("api/tracked-games.php");
  const data = await res.json();

  if (data.success) {
    grid.innerHTML = data.games.map(card).join("");
  } else {
    grid.innerHTML = `<p>${data.message}</p>`;
  }
}

loadTracked();

async function untrackGame(gameId) {

  const res = await fetch("api/untrack-game.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ game_id: gameId })
  });

  const data = await res.json();

  if (data.success) {
    showToast("Game removed from your list.");
    loadTracked();
  } else {
    showToast(data.message || "Error removing game.");
  }
}

function showToast(message) {
  const toast = document.getElementById("toast");

  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}