const track = document.getElementById("featuredGamesTrack");

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

      <div class="cardActions">
        <a class="btn" href="signup.html">
          View Details
        </a>
      </div>
    </article>
  `;
}

async function loadFeaturedGames() {
  const res = await fetch("api/main-home.php");
  const data = await res.json();

  if (!data.success) {
    track.innerHTML = `<p class="mini">Cannot load games.</p>`;
    return;
  }

  const games = data.games || [];
  track.innerHTML = [...games, ...games].map(card).join("");
}

loadFeaturedGames();
