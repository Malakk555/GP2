const grid = document.getElementById("gamesGrid");
const searchInput = document.getElementById("gameSearch");
const riskFilter = document.getElementById("riskFilter");
const sortFilter = document.getElementById("sortFilter");

let currentGames = [];

function card(game) {
  const isNew = game.analysis_status === "no_comments";
  const riskClass = isNew ? "" : `risk-${String(game.overall_risk_level || "Low").toLowerCase()}`;
  
  return `
    <article class="card">
      <div class="top-pills">
        ${isNew ? "" : `<span class="pill">${game.overall_risk_percent ?? 0}% Risk</span>`}
        <span class="pill ${isNew ? "new-pill" : riskClass}">
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
          .map(g => g.trim())
          .filter(g => g !== "")
          .map(g => `<span class="tag">${g}</span>`)
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

function render(list) {
  if (!list.length) {
    grid.innerHTML = `<p>No games found.</p>`;
    return;
  }

  grid.innerHTML = list.map(card).join("");
}

async function loadGames() {
  try {
    const res = await fetch("api/games.php");
    const data = await res.json();

    if (data.success) {
      currentGames = data.games || [];
      applyFilters();
    } else {
      grid.innerHTML = `<p>${data.message}</p>`;
    }
  } catch (error) {
    console.error(error);
    grid.innerHTML = `<p>Cannot load games.</p>`;
  }
}

function applyFilters() {
  const searchValue = searchInput.value.trim().toLowerCase();
  const selectedRisk = riskFilter ? riskFilter.value.toLowerCase() : "all";

  const filteredGames = currentGames.filter(game => {
    const gameName = (game.game_name || "").toLowerCase();
    const riskLevel = (game.overall_risk_level || "low").toLowerCase();

    const matchesSearch = gameName.includes(searchValue);
    const matchesRisk = selectedRisk === "all" || riskLevel === selectedRisk;

    return matchesSearch && matchesRisk;
  });

    if (sortFilter) {
    const sortValue = sortFilter.value;

    if (sortValue === "riskHigh") {
      filteredGames.sort((a, b) => Number(b.overall_risk_percent || 0) - Number(a.overall_risk_percent || 0));
    } else if (sortValue === "riskLow") {
      filteredGames.sort((a, b) => Number(a.overall_risk_percent || 0) - Number(b.overall_risk_percent || 0));
    } else if (sortValue === "nameAZ") {
      filteredGames.sort((a, b) => (a.game_name || "").localeCompare(b.game_name || ""));
    } else if (sortValue === "nameZA") {
      filteredGames.sort((a, b) => (b.game_name || "").localeCompare(a.game_name || ""));
    }
  }

  render(filteredGames);
}

searchInput.addEventListener("input", applyFilters);

if (riskFilter) {
  riskFilter.addEventListener("change", applyFilters);
}

if (sortFilter) {
  sortFilter.addEventListener("change", applyFilters);
}

loadGames();