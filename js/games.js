const grid = document.getElementById("gamesGrid");
const searchInput = document.getElementById("gameSearch");
const riskFilter = document.getElementById("riskFilter");
const sortFilter = document.getElementById("sortFilter");
const compareTray = document.getElementById("compareTray");
const compareTrayGames = document.getElementById("compareTrayGames");
const selectedCount = document.getElementById("selectedCount");
const clearCompareBtn = document.getElementById("clearCompareBtn");
const startComparisonBtn = document.getElementById("startComparisonBtn");

const gamesHomeLink = document.getElementById("gamesHomeLink");
const gamesComplaintsLink = document.getElementById("gamesComplaintsLink");

let loggedUser = {};

try {
  loggedUser = JSON.parse(
    localStorage.getItem("diraUser") || "{}"
  );
} catch (error) {
  console.error("Cannot read logged user:", error);
}

const currentRole =
  loggedUser.role || localStorage.getItem("role");

if (currentRole === "government") {
  if (gamesHomeLink) {
    gamesHomeLink.href = "government-dashboard.html";
  }

  if (gamesComplaintsLink) {
    gamesComplaintsLink.href = "report-management.html";
  }
}

let selectedGames = [];
let currentGames = [];
let trackedGames = [];

function card(game) {
  const isNew = game.analysis_status === "no_comments";
  const riskClass = isNew ? "" : `risk-${String(game.overall_risk_level || "Low").toLowerCase()}`;
  
  return `
    <article
  class="card"
  data-risk="${isNew ? "new" : String(game.overall_risk_level || "Low").toLowerCase()}"
>
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

  <div class="cardQuickActions">

   <button
  class="favoriteIconBtn ${
    trackedGames.includes(String(game.game_id))
      ? "favoriteIconBtn--selected"
      : ""
  }"
  type="button"
  data-id="${game.game_id}"
  title="${
    trackedGames.includes(String(game.game_id))
      ? "Remove from My List"
      : "Add to My List"
  }"
  aria-label="${
    trackedGames.includes(String(game.game_id))
      ? `Remove ${game.game_name} from My List`
      : `Add ${game.game_name} to My List`
  }"
>
  ${
    trackedGames.includes(String(game.game_id))
      ? "♥"
      : "♡"
  }
</button>

    <button
      class="compareIconBtn ${
        selectedGames.includes(String(game.game_id))
          ? "compareIconBtn--selected"
          : ""
      }"
      type="button"
      data-id="${game.game_id}"
      title="${
        selectedGames.includes(String(game.game_id))
          ? "Remove from Compare"
          : "Add to Compare"
      }"
      aria-label="${
        selectedGames.includes(String(game.game_id))
          ? "Remove from Compare"
          : "Add to Compare"
      }"
    >
      ⇄
    </button>

  </div>

  <a
    class="btn viewDetailsBtn"
    href="game-details.html?game_id=${game.game_id}"
  >
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

function updateCompareTray() {
  const selectedGameObjects = currentGames.filter(game =>
    selectedGames.includes(String(game.game_id))
  );

  if (selectedGames.length === 0) {
    selectedCount.textContent = "0 / 6 selected";
  startComparisonBtn.disabled = true;
  compareTrayGames.innerHTML = "";
  compareTray.classList.remove("show");
    return;
  }

  compareTray.classList.add("show");

  selectedCount.textContent = `${selectedGames.length} / 6 selected`;

  startComparisonBtn.disabled = selectedGames.length < 2;

  compareTrayGames.innerHTML = selectedGameObjects
    .map(game => `
      <div class="compareTrayGame">
        ${
          game.image_url
            ? `<img src="${game.image_url}" alt="${game.game_name}">`
            : `<div class="compareTrayPlaceholder"></div>`
        }

        <span>${game.game_name}</span>

        <button
          class="removeCompareGame"
          type="button"
          data-id="${game.game_id}"
          title="Remove from Compare"
          aria-label="Remove ${game.game_name} from comparison"
        >
          ×
        </button>
      </div>
    `)
    .join("");
}


grid.addEventListener("click", (event) => {
  const button = event.target.closest(".compareIconBtn");

  if (!button) return;

  const gameId = String(button.dataset.id);

  if (selectedGames.includes(gameId)) {
    selectedGames = selectedGames.filter(id => id !== gameId);
  } else {
    if (selectedGames.length >= 6) {
      return;
    }

    selectedGames.push(gameId);
  }

  applyFilters();
  updateCompareTray();
});

grid.addEventListener("click", async (event) => {
  const favoriteButton = event.target.closest(".favoriteIconBtn");

  if (!favoriteButton) return;

  const gameId = String(favoriteButton.dataset.id);
  const isTracked = trackedGames.includes(gameId);

  try {
    const endpoint = isTracked
      ? "api/untrack-game.php"
      : "api/track-game.php";

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        game_id: gameId
      })
    });

    const data = await res.json();

    if (!data.success) {
      console.error(data.message || "Failed to update My List.");
      return;
    }

    if (isTracked) {
  trackedGames = trackedGames.filter(id => id !== gameId);

  showToast("Game removed from your list");
} else {
  trackedGames.push(gameId);

  showToast("Game added to your list");
}

applyFilters();

  } catch (error) {
    console.error("My List error:", error);
  }
});

if (compareTrayGames) {
  compareTrayGames.addEventListener("click", (event) => {
    const removeButton = event.target.closest(".removeCompareGame");

    if (!removeButton) return;

    const gameId = String(removeButton.dataset.id);

    selectedGames = selectedGames.filter(id => id !== gameId);

    applyFilters();
    updateCompareTray();
  });
}

if (clearCompareBtn) {
  clearCompareBtn.addEventListener("click", () => {
    selectedGames = [];

    applyFilters();
    updateCompareTray();
  });
}

if (startComparisonBtn) {
  startComparisonBtn.addEventListener("click", () => {
    if (selectedGames.length < 2) return;

    const gameIds = selectedGames.join(",");

    window.location.href = `comparison.html?games=${gameIds}`;
  });
}


async function loadTrackedGames() {
  try {
    const res = await fetch("api/tracked-games.php");
    const data = await res.json();

    if (data.success) {
      trackedGames = (data.games || []).map(game =>
        String(game.game_id)
      );
    }
  } catch (error) {
    console.error("Cannot load tracked games:", error);
  }
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

if (searchInput) {
  searchInput.addEventListener("input", applyFilters);
}

if (riskFilter) {
  riskFilter.addEventListener("change", applyFilters);
}

if (sortFilter) {
  sortFilter.addEventListener("change", applyFilters);
}



async function initializeGamesPage() {
  await loadTrackedGames();
  await loadGames();
}

function showToast(message) {
  const toast = document.getElementById("toast");

  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

initializeGamesPage();