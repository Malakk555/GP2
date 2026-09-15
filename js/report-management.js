document.addEventListener("DOMContentLoaded", async () => {

  const params = new URLSearchParams(window.location.search);
  const gameId = params.get("game_id");

  const gameName = document.getElementById("reportGameName");
  const tableBody = document.getElementById("reportsManagementTable");


  try {

    /* =========================================
       CHOOSE API URL
    ========================================== */

    const apiUrl = gameId
      ? `api/game-reports.php?game_id=${encodeURIComponent(gameId)}`
      : "api/game-reports.php";


    const response = await fetch(apiUrl);

    const data = await response.json();


    if (!data.success) {
      throw new Error(
        data.message || "Failed to load complaints"
      );
    }


    /* =========================================
       PAGE TITLE
    ========================================== */

    if (gameId && data.game) {

      gameName.textContent =
        `${data.game.game_name} Complaints`;

    } else {

      gameName.textContent =
        "All Complaints";

    }


    /* =========================================
       CLEAR LOADING ROW
    ========================================== */

    tableBody.innerHTML = "";


    /* =========================================
       NO COMPLAINTS
    ========================================== */

    if (!data.reports || data.reports.length === 0) {

      tableBody.innerHTML = `
        <tr>
          <td colspan="4">
            ${
              gameId
                ? "No complaints found for this game."
                : "No complaints found."
            }
          </td>
        </tr>
      `;

      return;
    }


    /* =========================================
       DISPLAY COMPLAINTS
    ========================================== */

    data.reports.forEach(report => {

      const row =
        document.createElement("tr");


      const severityClass =
        String(report.severity || "")
          .toLowerCase();


      row.innerHTML = `

        <td>
          <strong>
            ${report.title || "-"}
          </strong>
        </td>


        <td>
          ${report.behavior || "-"}
        </td>


        <td>
          <span class="risk-badge ${severityClass}">
            ${report.severity || "-"}
          </span>
        </td>


        <td>
          ${report.location || "-"}
        </td>

      `;


      tableBody.appendChild(row);

    });


  } catch (error) {

    console.error(
      "Complaints error:",
      error
    );


    gameName.textContent =
      "Unable to Load Complaints";


    tableBody.innerHTML = `
      <tr>
        <td colspan="4">
          Unable to load complaint data.
        </td>
      </tr>
    `;

  }

});