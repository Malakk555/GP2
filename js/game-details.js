const params = new URLSearchParams(window.location.search);
const gameId = params.get("game_id");

function applyGameDetailsRoleActions() {

  const storedUser =
    localStorage.getItem('diraUser');

  const commentSection =
  document.getElementById('gameCommentSection');

  if (!storedUser) {
    return;
  }

  let user;

  try {
    user = JSON.parse(storedUser);
  } catch {
    return;
  }

  const role = user.role;

  if (commentSection) {
  commentSection.hidden =
    role !== 'individual';
}

  const trackBtn =
    document.getElementById('trackGameBtn');

  const saferBtn =
    document.getElementById('saferAlternativeBtn');

  const reportBtn =
    document.getElementById('reportGameBtn');

  if (role === 'employee') {

    if (reportBtn) {
      reportBtn.hidden = true;
    }

  }

  if (role === 'admin') {

    if (trackBtn) {
      trackBtn.hidden = true;
    }

    if (saferBtn) {
      saferBtn.hidden = true;
    }

    if (reportBtn) {
      reportBtn.hidden = true;
    }

  }

}

document.addEventListener("DOMContentLoaded", () => {

  applyGameDetailsRoleActions();

  const saferBtn =
    document.getElementById("saferAlternativeBtn");

  if (saferBtn && gameId) {
    saferBtn.href =
      `recommendations.html?game_id=${gameId}`;
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

function getRiskColor(value) {
  value = Number(value || 0);

  if (value >= 70) {
    return '#ef4444';
  }

  if (value >= 31) {
    return '#f59e0b';
  }

  return '#22c55e';
}

function setBar(id, value) {
  const bar = document.getElementById(id);

  if (!bar) return;

  const numericValue = Number(value || 0);

  bar.style.width =
    `${numericValue}%`;

  bar.style.setProperty(
    '--risk-color',
    getRiskColor(numericValue)
  );
}

const labelWeights = {
  sexual_harassment: 0.266,
  hate_speech: 0.201,
  bullying: 0.195,
  threat: 0.182,
  other_toxicity: 0.156
};

function labelPercent(count, total) {
  count = Number(count || 0);
  total = Number(total || 0);

  if (total <= 0) return 0;

  const percent =
    (count / total) * 100;

  return Number(percent.toFixed(2));
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
    setTrackButton(Number(game.is_tracked || 0) === 1);

    const isNoAnalysis =
  game.analysis_status !== "analyzed" ||
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

  const overallGauge =
  document.getElementById("overallGauge");

const overallRiskLevel =
  document.getElementById("overallRiskLevel");

const overallRisk =
  Number(game.overall_risk_percent || 0);

const overallColor =
  getRiskColor(overallRisk);

if (overallGauge) {

  overallGauge.style.setProperty(
    "--p",
    `${overallRisk}%`
  );

  overallGauge.style.background =
    `conic-gradient(
      ${overallColor} ${overallRisk}%,
      rgba(128, 128, 128, 0.18) 0
    )`;

  overallGauge.style.boxShadow =
    `0 0 24px ${overallColor}55`;
}

if (overallRiskLevel) {
  overallRiskLevel.style.color =
    overallColor;
}

const threat =
  labelPercent(
    game.threat,
    game.comments_count
  );

const bullying =
  labelPercent(
    game.bullying,
    game.comments_count
  );

const sexual =
  labelPercent(
    game.sexual_harassment,
    game.comments_count
  );

const other =
  labelPercent(
    game.other_toxicity,
    game.comments_count
  );

const hate =
  labelPercent(
    game.hate_speech,
    game.comments_count
  );

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

let isTracked = false;

function setTrackButton(tracked) {
  isTracked = !!tracked;
  const btn = document.getElementById("trackGameBtn");
  if (!btn) return;
  btn.textContent = isTracked ? "Tracked ✓" : "Track";
  btn.classList.toggle("tracked", isTracked);
}

function untrackGameFromDetails() {
  fetch("api/untrack-game.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ game_id: gameId })
  })
    .then(res => res.json())
    .then(data => {
      if (handleSessionExpired(data)) return;
      if (data.success) {
        setTrackButton(false);
        showToast("Game removed from your list.");
      } else {
        showToast(data.message || "Error removing game.");
      }
    });
}

function trackGame() {
  if (isTracked) {
    untrackGameFromDetails();
    return;
  }

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
  if (handleSessionExpired(data)) return;
  if (data.success || /already/i.test(data.message || "")) setTrackButton(true);
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

const gameCommentText =
  document.getElementById('gameCommentText');

const gameCommentCount =
  document.getElementById('gameCommentCount');

if (gameCommentText && gameCommentCount) {

  gameCommentText.addEventListener(
    'input',
    () => {

      gameCommentCount.textContent =
        `${gameCommentText.value.length} / 1000`;

    }
  );

}

function cleanUserComment(text) {

  return text
    .replace(/https?:\/\/\S+/gi, '')
    .replace(/www\.\S+/gi, '')
    .trim()
    .replace(/\s+/g, ' ');

}

function isValidUserComment(text) {

  const cleaned =
    cleanUserComment(text);

  if (!cleaned) {
    return false;
  }

  if (cleaned.length < 20) {
    return false;
  }

  if (!/[A-Za-z]/.test(cleaned)) {
    return false;
  }

  const words =
    cleaned.split(/\s+/);

  if (words.length < 3) {
    return false;
  }

  return true;
}
const submitGameCommentBtn =
  document.getElementById(
    'submitGameCommentBtn'
  );

const gameCommentMessage =
  document.getElementById(
    'gameCommentMessage'
  );

if (
  submitGameCommentBtn &&
  gameCommentText &&
  gameCommentMessage
) {

  submitGameCommentBtn.addEventListener(
    'click',
    async () => {

      const cleanedComment =
        cleanUserComment(
          gameCommentText.value
        );

      if (
        !isValidUserComment(
          cleanedComment
        )
      ) {

        gameCommentMessage.textContent =
          'Please enter a meaningful comment with at least 3 words.';

        return;
      }

      gameCommentMessage.textContent = '';

      submitGameCommentBtn.disabled = true;
      

      try {

        const response = await fetch(
          'api/submit-game-comment.php',
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json'
            },

            body: JSON.stringify({
              game_id: gameId,
              comment: cleanedComment
            })
          }
        );

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
            'Unable to analyze comment.'
          );
        }

        gameCommentText.value = '';

        gameCommentCount.textContent =
          '0 / 1000';

        showToast(
          'Comment submitted successfully.'
        );

        await loadGameDetails();

      } catch (error) {

        console.error(
          'Comment submit error:',
          error
        );

        gameCommentMessage.textContent =
          error.message ||
          'Unable to submit comment.';

      } finally {

        submitGameCommentBtn.disabled =
          false;

       
      }

    }
  );

}

loadGameDetails();
