console.log("Comparison ready");

let gamesData = [];

async function loadComparisonGames() {
  try {
    const response = await fetch("api/games.php");
    const data = await response.json();

    console.log("Games API:", data);

    if (!data.success) {
      document.getElementById("compareMessage").textContent =
        data.message || "Cannot load games.";
      return;
    }

    gamesData = data.games || [];
    setupAutocomplete("gameOneSearch", "gameOneSuggestions", "gameOne");
    setupAutocomplete("gameTwoSearch", "gameTwoSuggestions", "gameTwo");

  } catch (error) {
    console.error("Comparison load error:", error);
    document.getElementById("compareMessage").textContent = "Cannot load games.";
  }
}

function setupAutocomplete(inputId, suggestionsId, hiddenId) {
  const input = document.getElementById(inputId);
  const suggestions = document.getElementById(suggestionsId);
  const hidden = document.getElementById(hiddenId);

  input.addEventListener("input", () => {
    const value = input.value.toLowerCase().trim();
    hidden.value = "";

    if (value.length < 1) {
      suggestions.innerHTML = "";
      suggestions.style.display = "none";
      return;
    }

    const matches = gamesData.filter(game =>
      game.game_name &&
      game.game_name.toLowerCase().startsWith(value)
    );

    if (matches.length === 0) {
      suggestions.innerHTML = `<div class="suggestion-item">No games found</div>`;
      suggestions.style.display = "block";
      return;
    }

    suggestions.innerHTML = matches.map(game => `
      <div class="suggestion-item" data-id="${game.game_id}" data-name="${game.game_name}">
        ${game.game_name}
      </div>
    `).join("");

    suggestions.style.display = "block";
  });

  suggestions.addEventListener("click", (event) => {
    const item = event.target.closest(".suggestion-item");

    if (!item || !item.dataset.id) return;

    input.value = item.dataset.name;
    hidden.value = item.dataset.id;

    suggestions.innerHTML = "";
    suggestions.style.display = "none";
  });

  document.addEventListener("click", (event) => {
    if (!input.contains(event.target) && !suggestions.contains(event.target)) {
      suggestions.style.display = "none";
    }
  });
}

function getGameById(id) {
  return gamesData.find(game => String(game.game_id) === String(id));
}

function getRiskValue(game) {
  return Number(game.overall_risk_percent || 0);
}

function setRiskLevelPill(elementId, level) {
  const pill = document.getElementById(elementId);
  if (!pill) return;

  const riskLevel = level || "Low";

  pill.textContent = riskLevel;
  pill.className = `pill risk-${riskLevel.toLowerCase()}`;
}

const labelWeights = {
  sexual_harassment: 0.266,
  hate_speech: 0.201,
  bullying: 0.195,
  threat: 0.182,
  other_toxicity: 0.156
};

function weightedLabelPercent(count, total, label) {
  count = Number(count || 0);
  total = Number(total || 0);

  if (total <= 0) return 0;

  const rawPercent = (count / total) * 100;
  const weightedPercent = rawPercent * labelWeights[label];

  return Number(weightedPercent.toFixed(2));
}

function compareGames() {
  const gameOneId = document.getElementById("gameOne").value;
  const gameTwoId = document.getElementById("gameTwo").value;
  const message = document.getElementById("compareMessage");

  if (!gameOneId || !gameTwoId) {
    message.textContent = "Please select two games to compare.";
    return;
  }

  if (gameOneId === gameTwoId) {
    message.textContent = "Please select two different games.";
    return;
  }

  const gameOne = getGameById(gameOneId);
  const gameTwo = getGameById(gameTwoId);

  if (!gameOne || !gameTwo) {
    message.textContent = "Game data is missing.";
    return;
  }

  if (
  gameOne.analysis_status === "no_comments" ||
  gameTwo.analysis_status === "no_comments"
) {
  message.textContent =
    "Comparison is not available because one of the selected games is still new and does not have enough comments yet.";

  document.getElementById("comparisonResult").style.display = "none";

  return;
}

  message.textContent = "";
  document.getElementById("comparisonResult").style.display = "block";

  const riskOne = getRiskValue(gameOne);
  const riskTwo = getRiskValue(gameTwo);

  document.getElementById("gameOneName").textContent = gameOne.game_name;
  document.getElementById("gameTwoName").textContent = gameTwo.game_name;

  setRiskLevelPill("gameOneRiskLevel", gameOne.overall_risk_level);
  setRiskLevelPill("gameTwoRiskLevel", gameTwo.overall_risk_level);

  document.getElementById("gameOneImage").src = gameOne.image_url || "";
  document.getElementById("gameTwoImage").src = gameTwo.image_url || "";

  document.getElementById("riskOne").textContent = riskOne + "%";
  document.getElementById("riskTwo").textContent = riskTwo + "%";

  setCircle("circleOne", riskOne);
  setCircle("circleTwo", riskTwo);

  document.getElementById("breakdownOne").innerHTML = createBreakdown(gameOne);
  document.getElementById("breakdownTwo").innerHTML = createBreakdown(gameTwo);

  const resultText = document.getElementById("resultText");

    resultText.innerHTML = createComparisonSummary(gameOne, gameTwo);
}

function createComparisonSummary(gameOne, gameTwo) {
  const riskOne = getRiskValue(gameOne);
  const riskTwo = getRiskValue(gameTwo);
  const difference = Math.abs(riskOne - riskTwo);

  if (riskOne === riskTwo) {
    return `
      <strong>${gameOne.game_name}</strong> and <strong>${gameTwo.game_name}</strong> have the same overall risk score.
      The detected risk difference is relatively minor and no significantly dominant toxic behavior category was identified.
    `;
  }

  const higherGame = riskOne > riskTwo ? gameOne : gameTwo;
  const lowerGame = riskOne > riskTwo ? gameTwo : gameOne;

  const topLabels = getTopToxicLabels(higherGame);

  if (difference <= 5 || topLabels.length === 0) {
    return `
      <strong>${higherGame.game_name}</strong> has a slightly higher overall risk score than <strong>${lowerGame.game_name}</strong>.
      The detected risk difference is relatively minor and no significantly dominant toxic behavior category was identified.
    `;
  }

  return `
    <strong>${higherGame.game_name}</strong> has a higher overall risk score than <strong>${lowerGame.game_name}</strong>.
    The increase is mainly associated with higher <strong>${formatLabels(topLabels)}</strong> indicators detected in community discussions.
    This may indicate a more negative interaction environment compared to the other game.
  `;
}

function getTopToxicLabels(game) {
 const labels = [
  { name: "bullying", value: weightedLabelPercent(game.bullying, game.comments_count, "bullying") },
  { name: "sexual harassment", value: weightedLabelPercent(game.sexual_harassment, game.comments_count, "sexual_harassment") },
  { name: "threat", value: weightedLabelPercent(game.threat, game.comments_count, "threat") },
  { name: "hate speech", value: weightedLabelPercent(game.hate_speech, game.comments_count, "hate_speech") },
  { name: "other toxicity", value: weightedLabelPercent(game.other_toxicity, game.comments_count, "other_toxicity") }
];

  return labels
    .filter(label => label.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 2)
    .map(label => label.name);
}

function formatLabels(labels) {
  if (labels.length === 1) return labels[0];
  return `${labels[0]} and ${labels[1]}`;
}

function setCircle(circleId, percentage) {
  const circle = document.getElementById(circleId);

  const styles = getComputedStyle(document.body);
  const fill = styles.getPropertyValue("--compare-circle-fill").trim() || "#32C5D2";
  const track = styles.getPropertyValue("--compare-circle-track").trim() || "#d9d9d9";

  circle.style.background = `
    conic-gradient(
      ${fill} 0% ${percentage}%,
      ${track} ${percentage}% 100%
    )
  `;
}

function createBreakdown(game) {
  /*
    ملاحظة:
    جدول games اللي أرسلتيه ما فيه breakdown columns
    لذلك مؤقتًا بنحط 0 إلى أن تربطونها من جدول آخر أو تضيفون الأعمدة.
  */
  return `
  ${createBar("Bullying", weightedLabelPercent(game.bullying, game.comments_count, "bullying"))}

  ${createBar("Sexual Harassment", weightedLabelPercent(game.sexual_harassment, game.comments_count, "sexual_harassment"))}

  ${createBar("Threat", weightedLabelPercent(game.threat, game.comments_count, "threat"))}

  ${createBar("Hate Speech", weightedLabelPercent(game.hate_speech, game.comments_count, "hate_speech"))}

  ${createBar("Other Toxicity", weightedLabelPercent(game.other_toxicity, game.comments_count, "other_toxicity"))}
`;
}

function createBar(label, value) {
  const percent = Number(value || 0);

  return `
    <div class="risk-row">
      <strong>${label}</strong>
      <small>${percent}%</small>
      <div class="bar">
        <span style="width:${percent}%"></span>
      </div>
    </div>
  `;
}

loadComparisonGames();