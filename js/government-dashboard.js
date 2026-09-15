document.addEventListener("DOMContentLoaded", async () => {

  const tableBody =
    document.getElementById("reportedGamesTable");

  const tableHead =
    document.querySelector(".government-games-table table thead");

  const tableTitle =
    document.getElementById("tableSectionTitle");

  const tableDescription =
    document.getElementById("tableSectionDescription");

  const backButton =
    document.getElementById("backToGamesBtn");

  const analysisLayout =
    document.querySelector(".government-analysis-layout");


  /* =========================================
     RISK WEIGHTS
  ========================================= */

  const RISK_WEIGHTS = {
    threat: 0.182,
    bullying: 0.195,
    sexual_harassment: 0.266,
    hate_speech: 0.201,
    other_toxicity: 0.156
  };


  function calculateWeightedRisk(
    rawValue,
    commentsCount,
    weight
  ) {

    const raw = Number(rawValue);
    const total = Number(commentsCount);

    if (!total || total <= 0) {
      return 0;
    }

    const rawPercent =
      (raw / total) * 100;

    return rawPercent * weight;
  }



  /* =========================================
     GAME BREAKDOWN
  ========================================= */

  function showGameBreakdown(game) {

    document.getElementById(
      "panelGameImage"
    ).src = game.image_url;


    document.getElementById(
      "panelGameName"
    ).textContent = game.game_name;


    document.getElementById(
      "panelOverallRisk"
    ).textContent =
      Number(
        game.overall_risk_percent
      ).toFixed(2) + "%";


    const riskLevel =
      document.getElementById(
        "panelRiskLevel"
      );


    riskLevel.textContent =
      game.overall_risk_level;


    riskLevel.className =
      "risk-badge " +
      game.overall_risk_level.toLowerCase();



    /* Weighted Risk Breakdown */

    const threatRisk =
      calculateWeightedRisk(
        game.breakdown.threat,
        game.comments_count,
        RISK_WEIGHTS.threat
      );


    const bullyingRisk =
      calculateWeightedRisk(
        game.breakdown.bullying,
        game.comments_count,
        RISK_WEIGHTS.bullying
      );


    const sexualRisk =
      calculateWeightedRisk(
        game.breakdown.sexual_harassment,
        game.comments_count,
        RISK_WEIGHTS.sexual_harassment
      );


    const hateRisk =
      calculateWeightedRisk(
        game.breakdown.hate_speech,
        game.comments_count,
        RISK_WEIGHTS.hate_speech
      );


    const otherRisk =
      calculateWeightedRisk(
        game.breakdown.other_toxicity,
        game.comments_count,
        RISK_WEIGHTS.other_toxicity
      );



    document.getElementById(
      "panelThreat"
    ).textContent =
      threatRisk.toFixed(2) + "%";


    document.getElementById(
      "panelBullying"
    ).textContent =
      bullyingRisk.toFixed(2) + "%";


    document.getElementById(
      "panelSexualHarassment"
    ).textContent =
      sexualRisk.toFixed(2) + "%";


    document.getElementById(
      "panelHateSpeech"
    ).textContent =
      hateRisk.toFixed(2) + "%";


    document.getElementById(
      "panelOtherToxicity"
    ).textContent =
      otherRisk.toFixed(2) + "%";


    analysisLayout.classList.add(
      "show-analysis"
    );
  }



  /* =========================================
     MAIN GAMES TABLE
  ========================================= */

  function showGamesTable(games) {

    tableTitle.textContent =
      "Games with Complaints";


    tableDescription.textContent =
      "View games with submitted complaints and review their details.";


    backButton.hidden = true;


    tableHead.innerHTML = `
      <tr>
        <th>Game</th>
        <th>Complaints</th>
        <th>Overall Risk</th>
        <th>Risk Level</th>
      </tr>
    `;


    tableBody.innerHTML = "";


    if (games.length === 0) {

      tableBody.innerHTML = `
        <tr>
          <td colspan="4">
            No games with complaints found.
          </td>
        </tr>
      `;

      return;
    }


    games.forEach(game => {

      const row =
        document.createElement("tr");


      row.innerHTML = `

        <td>
          <button
            class="game-name-btn"
            data-game-id="${game.game_id}">
            ${game.game_name}
          </button>
        </td>


        <td>
          <button
            class="complaint-count-btn"
            data-game-id="${game.game_id}">
            ${game.report_count}
          </button>
        </td>


        <td>
          ${Number(
            game.overall_risk_percent
          ).toFixed(2)}%
        </td>


        <td>
          <span
            class="risk-badge
            ${game.overall_risk_level.toLowerCase()}">
            ${game.overall_risk_level}
          </span>
        </td>

      `;


      tableBody.appendChild(row);
    });



    /* Clicking game name or complaint number */

    document
      .querySelectorAll(
        ".game-name-btn, .complaint-count-btn"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          () => {

            const gameId =
              Number(
                button.dataset.gameId
              );


            const game =
              games.find(
                item =>
                  item.game_id === gameId
              );


            if (!game) return;


            showComplaintsTable(game);

          }
        );

      });
  }



  /* =========================================
     COMPLAINTS TABLE
  ========================================= */

  async function showComplaintsTable(game) {

    /* Show game breakdown */
    showGameBreakdown(game);


    /* Change section title */

    tableTitle.textContent =
      game.game_name + " Complaints";


    tableDescription.textContent =
      "Review complaint details submitted for this game.";


    backButton.hidden = false;



    /* Complaint table headers */

    tableHead.innerHTML = `
      <tr>
        <th>Complaint Title</th>
        <th>Complaint Details</th>
        <th>Seriousness</th>
        <th>Detected At</th>
        <th>Complaint Date</th>
      </tr>
    `;



    /* Loading state */

    tableBody.innerHTML = `
      <tr>
        <td colspan="5">
          Loading complaints...
        </td>
      </tr>
    `;



    try {

      const response =
        await fetch(
          `api/game-reports.php?game_id=${game.game_id}`
        );


      const data =
        await response.json();


      if (!data.success) {

        throw new Error(
          data.message ||
          "Unable to load complaints"
        );
      }


      tableBody.innerHTML = "";



      /* No complaints */

      if (data.reports.length === 0) {

        tableBody.innerHTML = `
          <tr>
            <td colspan="5">
              No complaints found for this game.
            </td>
          </tr>
        `;

        return;
      }



      /* Create complaint rows */

      data.reports.forEach(
        complaint => {

          const row =
            document.createElement("tr");


          const severityClass =
            (
              complaint.severity || ""
            ).toLowerCase();



          /* Complaint Date */

          let complaintDate = "-";


          if (complaint.date_reported) {

            const date =
              new Date(
                complaint.date_reported
                  .replace(" ", "T")
              );


            if (!isNaN(date)) {

              complaintDate =
                date.toLocaleDateString(
                  "en-GB",
                  {
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                  }
                );
            }
          }



          row.innerHTML = `

            <td>
              <strong>
                ${complaint.title || "-"}
              </strong>
            </td>


            <td>
              ${complaint.behavior || "-"}
            </td>


            <td>
              <span
                class="risk-badge ${severityClass}">
                ${complaint.severity || "-"}
              </span>
            </td>


            <td>
              ${complaint.location || "-"}
            </td>


            <td>
              ${complaintDate}
            </td>

          `;


          tableBody.appendChild(row);

        }
      );


    } catch (error) {

      console.error(error);


      tableBody.innerHTML = `
        <tr>
          <td colspan="5">
            Unable to load complaint data.
          </td>
        </tr>
      `;
    }

  }



  /* =========================================
     LOAD DASHBOARD
  ========================================= */

  try {

    const response =
      await fetch(
        "api/government-dashboard.php"
      );


    const data =
      await response.json();


    if (!data.success) {

      throw new Error(
        "Failed to load dashboard data"
      );
    }



    /* =========================================
       SUMMARY CARDS
    ========================================= */

    document.getElementById(
      "totalReports"
    ).textContent =
      data.summary.total_reports;


    document.getElementById(
      "totalReportedGames"
    ).textContent =
      data.summary.total_reported_games;


    document.getElementById(
      "highRiskGames"
    ).textContent =
      data.summary.high_risk_games;



    /* =========================================
       INITIAL GAMES TABLE
    ========================================= */

    showGamesTable(data.games);



    /* =========================================
       BACK TO GAMES
    ========================================= */

    backButton.addEventListener(
      "click",
      () => {

        /* Hide analysis card */

        analysisLayout.classList.remove(
          "show-analysis"
        );


        /* Return main table */

        showGamesTable(data.games);

      }
    );


  } catch (error) {

    console.error(error);


    tableBody.innerHTML = `
      <tr>
        <td colspan="4">
          Unable to load dashboard data.
        </td>
      </tr>
    `;
  }

});