document.addEventListener("DOMContentLoaded", async () => {

  const params = new URLSearchParams(window.location.search);
  const gameId = params.get("game_id");

  const gameName = document.getElementById("reportGameName");
  const tableBody = document.getElementById("reportsManagementTable");


  /* No game selected */
  if (!gameId) {

    gameName.textContent = "Game Not Found";

    tableBody.innerHTML = `
      <tr>
        <td colspan="4">
          No game was selected.
        </td>
      </tr>
    `;

    return;
  }


  try {

    const response = await fetch(
      `api/game-reports.php?game_id=${encodeURIComponent(gameId)}`
    );

    const data = await response.json();


    if (!data.success) {
      throw new Error(data.message || "Failed to load reports");
    }


    /* Game name */
    gameName.textContent = data.game.game_name;


    /* Clear loading row */
    tableBody.innerHTML = "";


    /* No reports */
    if (data.reports.length === 0) {

      tableBody.innerHTML = `
        <tr>
          <td colspan="4">
            No reports found for this game.
          </td>
        </tr>
      `;

      return;
    }


    /* Reports */
    data.reports.forEach(report => {

      const row = document.createElement("tr");

      const severityClass =
        report.severity.toLowerCase();

      row.innerHTML = `
        <td>
          <strong>${report.title}</strong>
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

    console.error(error);

    gameName.textContent = "Unable to Load Reports";

    tableBody.innerHTML = `
      <tr>
        <td colspan="4">
          Unable to load report data.
        </td>
      </tr>
    `;

  }

});