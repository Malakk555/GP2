const welcomeName = document.getElementById("welcomeName");
const trackedCount = document.getElementById("trackedCount");
const alertsCount = document.getElementById("alertsCount");
const reportsReviewCount = document.getElementById("reportsReviewCount");
const submittedReportsCount = document.getElementById("submittedReportsCount");
const recentGames = document.getElementById("recentGames");
const homeSearch = document.getElementById("homeSearch");

let recentGamesList = [];

function card(game) {
  const isNew = game.analysis_status === "no_comments" || Number(game.comments_count || 0) === 0;
const riskClass = isNew ? "new-pill" : `risk-${String(game.overall_risk_level || "Low").toLowerCase()}`;
  
  return `
    <article class="card marquee-card">
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

      <br>

            <div class="cardActions">
        <a class="btn" href="game-details.html?game_id=${game.game_id}">
          View Details
        </a>
      </div>
    </article>
  `;
}

function renderGames(list) {
  if (list.length === 0) {
    recentGames.innerHTML = `<p class="mini">No games found.</p>`;
    return;
  }

  recentGames.innerHTML = list.map(card).join("");
}

async function loadHome() {
  try {
    const res = await fetch("api/home.php");
    const data = await res.json();

    if (!data.success) {
      welcomeName.textContent = "Hello!";
      recentGames.innerHTML = `<p class="mini">${data.message}</p>`;
      return;
    }

    welcomeName.textContent = `Hello ${data.user.name}!`;

    trackedCount.textContent = data.stats.tracked_games;
    alertsCount.textContent = data.stats.active_alerts;
    reportsReviewCount.textContent = data.stats.reports_in_review;
    submittedReportsCount.textContent = data.stats.submitted_reports;

    recentGamesList = data.recent_games || [];
    renderGames([...recentGamesList, ...recentGamesList]);

  } catch (error) {
    recentGames.innerHTML = `<p class="mini">Cannot load home data.</p>`;
  }
}

homeSearch.addEventListener("input", async function () {
  const value = this.value.trim();

  if (value === "") {
    recentGames.classList.remove("is-searching");
    renderGames([...recentGamesList, ...recentGamesList]);
    return;
  }

  recentGames.classList.add("is-searching");

  const res = await fetch(`api/search-games.php?q=${encodeURIComponent(value)}`);
  const data = await res.json();

  renderGames(data.games || []);
});

loadHome();