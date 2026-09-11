const recoStage = document.getElementById("recoStage");
const recoTrack = document.getElementById("recoTrack");
const recommendationNote = document.getElementById("recommendationNote");

const params = new URLSearchParams(window.location.search);
const currentGameId = params.get("game_id");

let recommendedGames = [];
let currentIndex = 0;
let startX = 0;
let isDragging = false;
let dragMoved = 0;

async function loadRecommendations() {
  if (!currentGameId) {
    recommendationNote.textContent = "Missing game_id. Open this page from Safer Alternative button.";
    return;
  }

  try {
    const currentGameResponse = await fetch(`api/game-details.php?game_id=${currentGameId}`);
    const currentGameData = await currentGameResponse.json();

    if (!currentGameData.success || !currentGameData.game) {
      recommendationNote.textContent = "Cannot load current game details.";
      return;
    }

    const currentGame = currentGameData.game;

    const gamesResponse = await fetch("api/games.php");
    const gamesData = await gamesResponse.json();

    if (!gamesData.success || !gamesData.games) {
      recommendationNote.textContent = "Cannot load games.";
      return;
    }

    const allGames = gamesData.games;

const currentRisk = Number(currentGame.overall_risk_percent || 0);

recommendedGames = allGames
  .map(game => ({
    ...game,
    matchingGenresCount: countMatchingGenres(game.genre, currentGame.genre)
  }))
  .filter(game => {
    const notSameGame = String(game.game_id) !== String(currentGame.game_id);

    const lowLevel = String(game.overall_risk_level || "")
      .trim()
      .toLowerCase() === "low";

    const hasMatchingGenre = game.matchingGenresCount >= 1;

    return notSameGame && lowLevel && hasMatchingGenre;
  })
  .sort((a, b) => {
    if (b.matchingGenresCount !== a.matchingGenresCount) {
      return b.matchingGenresCount - a.matchingGenresCount;
    }

    return Number(a.overall_risk_percent || 0) - Number(b.overall_risk_percent || 0);
  });

    if (!recommendedGames.length) {
      recoTrack.innerHTML = "";
      recommendationNote.innerHTML =
        `No safer alternatives found with the same genre as <strong>${currentGame.game_name}</strong>.`;
      return;
    }

    recommendationNote.innerHTML =
      `Safer alternatives for <strong>${currentGame.game_name}</strong> based on the same genre: <strong>${currentGame.genre}</strong>.`;

    renderRecommendationCards(recommendedGames);
    updateRecoCarousel();

  } catch (error) {
    console.error(error);
    recommendationNote.textContent = "Cannot load recommendations.";
  }
}

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function renderTags(value) {
  return getGenres(value)
    .map(genre => `<span class="tag">${genre}</span>`)
    .join("");
}

function getGenres(value) {
  return String(value || "")
    .toLowerCase()
    .split(",")
    .map(genre => genre.trim())
    .filter(Boolean);
}

function countMatchingGenres(gameGenre, currentGenre) {
  const gameGenres = getGenres(gameGenre);
  const currentGenres = getGenres(currentGenre);

  return gameGenres.filter(g => currentGenres.includes(g)).length;
}

function renderRecommendationCards(games) {
  recoTrack.innerHTML = games.map(game => {
    const risk = Number(game.overall_risk_percent || 0).toFixed(2);
    const riskLevel = game.overall_risk_level || "Low";
    const riskClass = `risk-${String(riskLevel).toLowerCase()}`;

    return `
      <article class="reco-card">
       <div class="reco-thumb">
  <img src="${game.image_url || "images/default-game.jpg"}" alt="${game.game_name || "Game image"}">
  <span class="pill left risk-score-pill">${risk}% Risk</span>
<span class="pill right ${riskClass}">${riskLevel}</span>
</div>

        <h2>${game.game_name || "Game Name"}</h2>

        <p class="mini">${game.description || ""}</p>

        <div class="tags">
  ${renderTags(game.genre)}
  ${game.platform ? `<span class="tag">${game.platform}</span>` : ""}
</div>

         <div class="cardActions">
          <a class="btn" href="game-details.html?game_id=${game.game_id}">
            View Details
          </a>
        </div>
      </article>
    `;
  }).join("");
}

function getRecoCards() {
  return Array.from(document.querySelectorAll(".reco-card"));
}

function updateRecoCarousel() {
  const recoCards = getRecoCards();

  recoCards.forEach((card, index) => {
    const offset = index - currentIndex;

    let translateX = offset * 360;
    let scale = 0.78;
    let opacity = 0.35;
    let zIndex = 1;
    let rotateY = 0;

    if (offset === 0) {
      translateX = 0;
      scale = 1;
      opacity = 1;
      zIndex = 10;
      rotateY = 0;
      card.classList.add("active");
    } else if (offset === -1) {
      translateX = -310;
      scale = 0.82;
      opacity = 0.75;
      zIndex = 6;
      rotateY = 10;
      card.classList.remove("active");
    } else if (offset === 1) {
      translateX = 310;
      scale = 0.82;
      opacity = 0.75;
      zIndex = 6;
      rotateY = -10;
      card.classList.remove("active");
    } else if (offset < -1) {
      translateX = -520;
      scale = 0.68;
      opacity = 0.18;
      zIndex = 2;
      rotateY = 14;
      card.classList.remove("active");
    } else if (offset > 1) {
      translateX = 520;
      scale = 0.68;
      opacity = 0.18;
      zIndex = 2;
      rotateY = -14;
      card.classList.remove("active");
    }

    card.style.transform =
      `translate(-50%, -50%) translateX(${translateX}px) scale(${scale}) rotateY(${rotateY}deg)`;

    card.style.opacity = opacity;
    card.style.zIndex = zIndex;
    card.style.filter = offset === 0 ? "blur(0px)" : "blur(0.4px)";
  });
}

function clampIndex(index) {
  const recoCards = getRecoCards();

  if (index < 0) return 0;
  if (index > recoCards.length - 1) return recoCards.length - 1;

  return index;
}

if (recoStage) {
  recoStage.addEventListener("mousedown", (e) => {
    isDragging = true;
    startX = e.clientX;
    dragMoved = 0;
  });

  window.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    dragMoved = e.clientX - startX;
  });

  window.addEventListener("mouseup", () => {
    if (!isDragging) return;

    if (dragMoved < -60) {
      currentIndex = clampIndex(currentIndex + 1);
    } else if (dragMoved > 60) {
      currentIndex = clampIndex(currentIndex - 1);
    }

    isDragging = false;
    dragMoved = 0;
    updateRecoCarousel();
  });

  recoStage.addEventListener("touchstart", (e) => {
    startX = e.touches[0].clientX;
    isDragging = true;
  });

  recoStage.addEventListener("touchmove", (e) => {
    if (!isDragging) return;
    dragMoved = e.touches[0].clientX - startX;
  });

  recoStage.addEventListener("touchend", () => {
    if (!isDragging) return;

    if (dragMoved < -50) {
      currentIndex = clampIndex(currentIndex + 1);
    } else if (dragMoved > 50) {
      currentIndex = clampIndex(currentIndex - 1);
    }

    isDragging = false;
    dragMoved = 0;
    updateRecoCarousel();
  });
}

loadRecommendations();