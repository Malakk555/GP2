const params = new URLSearchParams(window.location.search);
const gameId = params.get("game_id");

document.addEventListener("DOMContentLoaded", () => {
  const saferBtn = document.getElementById("saferAlternativeBtn");

  if (saferBtn && gameId) {
    saferBtn.href = `recommendations.html?game_id=${gameId}`;
  }
});

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function setValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value;
}

function setHTML(id, value) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = value;
}

function setBar(id, value) {
  const bar = document.getElementById(id);
  if (bar) bar.style.width = `${value}%`;
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

async function loadGameDetails() {
  if (!gameId) {
    alert("Missing game_id in URL. Open this page from View Details button.");
    return;
  }

  try {
    const res = await fetch(`api/game-details.php?game_id=${gameId}`);
    const data = await res.json();

    console.log("Game details API:", data);

    if (!data.success || !data.game) {
      alert(data.message || "Cannot load game details.");
      return;
    }

    const game = data.game;

    const isNoAnalysis =
  game.analysis_status === "no_comments" ||
  Number(game.comments_count || 0) === 0;

const noAnalysisMessage = document.getElementById("noAnalysisMessage");
const detailMetrics = document.querySelector(".detailMetrics");

if (isNoAnalysis) {
  if (noAnalysisMessage) noAnalysisMessage.style.display = "block";
  if (detailMetrics) detailMetrics.style.display = "none";

  setText("overallRiskPercent", "New");
  setText("overallRiskLevel", "No analysis available");
  setText("lastUpdated", "Not analyzed yet");
} else {
  if (noAnalysisMessage) noAnalysisMessage.style.display = "none";
  if (detailMetrics) detailMetrics.style.display = "grid";

  setText("overallRiskPercent", `${game.overall_risk_percent || 0}%`);
  setText("overallRiskLevel", game.overall_risk_level || "Low");
  setText("lastUpdated", game.analyzed_at || "Today");

  const overallGauge = document.getElementById("overallGauge");
  if (overallGauge) {
    overallGauge.style.setProperty("--p", `${game.overall_risk_percent || 0}%`);
  }

const threat = weightedLabelPercent(game.threat, game.comments_count, "threat");
const bullying = weightedLabelPercent(game.bullying, game.comments_count, "bullying");
const sexual = weightedLabelPercent(game.sexual_harassment, game.comments_count, "sexual_harassment");
const other = weightedLabelPercent(game.other_toxicity, game.comments_count, "other_toxicity");
const hate = weightedLabelPercent(game.hate_speech, game.comments_count, "hate_speech");

  setText("bullyingPercent", `${bullying}%`);
  setText("sexualPercent", `${sexual}%`);
  setText("threatPercent", `${threat}%`);
  setText("hatePercent", `${hate}%`);
  setText("otherPercent", `${other}%`);

  setBar("bullyingBar", bullying);
  setBar("sexualBar", sexual);
  setBar("threatBar", threat);
  setBar("hateBar", hate);
  setBar("otherBar", other);
}

const saferBtn = document.getElementById("saferAlternativeBtn");
if (saferBtn) {
  saferBtn.href = `recommendations.html?game_id=${game.game_id}`;
}


    setText("gameName", game.game_name || "Game Name");
    console.log("image_url:", game.image_url);

const gameImage = document.getElementById("gameImage");

if (gameImage) {
  gameImage.src = game.image_url || "images/default-game.jpg";
  gameImage.alt = game.game_name || "Game image";
}
    setText("gameDescription", game.description || "");


    setHTML("gameGenres", `
  ${(game.genre || "")
    .split(",")
    .map(g => `<span class="tag">${g.trim()}</span>`)
    .join("")}
`);


    setValue("reportGameId", game.game_id);

  } catch (error) {
    console.error("Game details error:", error);
    alert("Cannot load game details. Check api/game-details.php");
  }
}

function openReportModal() {
  const reportModal = document.getElementById("reportModal");
  if (reportModal) reportModal.classList.add("show");

  setText("reportGameName", document.getElementById("gameName")?.textContent || "");
  setText("reportRiskPercent", document.getElementById("overallRiskPercent")?.textContent || "");
  setText("reportRiskLevel", document.getElementById("overallRiskLevel")?.textContent || "");
}

function closeReportModal() {
  const reportModal = document.getElementById("reportModal");
  if (reportModal) reportModal.classList.remove("show");
}

function trackGame() {
  if (!gameId) {
    alert("Missing game_id.");
    return;
  }

  fetch("api/track-game.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      game_id: gameId
    })
  })
    .then(res => res.json())
    .then(data => {
  showToast(data.message || "Game added to your list.");
})
    .catch(error => {
      console.error(error);
      alert("Cannot track game.");
    });
}

const behaviorOtherCheck = document.getElementById("behaviorOtherCheck");
const behaviorOtherText = document.getElementById("behaviorOtherText");

if (behaviorOtherCheck && behaviorOtherText) {
  behaviorOtherText.style.display = "none";

  behaviorOtherCheck.addEventListener("change", function () {
    behaviorOtherText.style.display = this.checked ? "block" : "none";

    if (!this.checked) {
      behaviorOtherText.value = "";
    }
  });
}

const reportForm = document.getElementById("reportForm");

if (reportForm) {
  reportForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const formData = new FormData(this);

    fetch("api/create-report.php", {
      method: "POST",
      body: formData
    })
      .then(async res => {
        const text = await res.text();
        console.log("Create report response:", text);

        try {
          return JSON.parse(text);
        } catch {
          throw new Error(text);
        }
      })
      .then(data => {
        const reportMessage = document.getElementById("reportMessage");

        if (data.success) {
  this.reset();

  if (behaviorOtherText) {
    behaviorOtherText.style.display = "none";
    behaviorOtherText.value = "";
  }

  showToast("Report submitted successfully.");
closeReportModal();
} else {
  if (reportMessage) {
    reportMessage.textContent = data.message;
  }
}
      })
      .catch(error => {
        console.error("Submit error:", error);

        const reportMessage = document.getElementById("reportMessage");
        if (reportMessage) {
          reportMessage.textContent =
            "Cannot submit report. Check Console.";
        }
      });
  });
}

function showToast(message) {
  const toast = document.getElementById("toast");

  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}


loadGameDetails();
