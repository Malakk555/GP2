document.addEventListener("DOMContentLoaded", async () => {

  const tableBody =
    document.getElementById("adminGamesTable");

  const searchInput =
    document.getElementById("adminGameSearch");

  const riskFilter =
    document.getElementById("adminRiskFilter");


  let games = [];


  /* =========================================
     ESCAPE HTML
  ========================================= */

  function escapeHtml(value) {

    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }



  /* =========================================
     RISK BADGE
  ========================================= */

  function getRiskBadge(game) {

    const isNew =
      game.analysis_status === "no_comments" ||
      game.overall_risk_level === "New";


    if (isNew) {

      return `
        <span class="pill new-pill">
          New
        </span>
      `;
    }


    const riskLevel =
      String(
        game.overall_risk_level || "Low"
      ).toLowerCase();


    return `
      <span class="pill risk-${riskLevel}">
        ${escapeHtml(game.overall_risk_level || "Low")}
      </span>
    `;
  }



  /* =========================================
     ANALYSIS STATUS
  ========================================= */

  function formatAnalysisStatus(status) {

    if (status === "analyzed") {
      return "Analyzed";
    }

    if (status === "no_comments") {
      return "No Analysis";
    }

    return status || "Pending";
  }



  /* =========================================
     RENDER TABLE
  ========================================= */

  function renderGames(list) {

    tableBody.innerHTML = "";


    if (!list.length) {

      tableBody.innerHTML = `
        <tr>
          <td colspan="7">
            No games found.
          </td>
        </tr>
      `;

      return;
    }


    list.forEach(game => {

      const isNew =
        game.analysis_status === "no_comments" ||
        game.overall_risk_level === "New";


      const riskPercent =
        isNew
          ? "—"
          : `${Number(
              game.overall_risk_percent || 0
            ).toFixed(2)}%`;


      const image = game.image_url
        ? `
          <img
            class="admin-game-image"
            src="${escapeHtml(game.image_url)}"
            alt="${escapeHtml(game.game_name)}"
          >
        `
        : `
          <div class="admin-game-image-placeholder">
            🎮
          </div>
        `;


      const row =
        document.createElement("tr");


      row.innerHTML = `

        <td>

          <div class="admin-game-info">

            ${image}

            <div>

              <strong>
                ${escapeHtml(game.game_name)}
              </strong>

              <small>
                ID: ${escapeHtml(game.game_id)}
              </small>

            </div>

          </div>

        </td>


        <td>
          ${escapeHtml(game.genre || "—")}
        </td>


        <td>
          ${escapeHtml(game.platform || "—")}
        </td>


        <td>
          <strong>
            ${riskPercent}
          </strong>
        </td>


        <td>
          ${getRiskBadge(game)}
        </td>


        <td>

          <span class="admin-analysis-status">
            ${escapeHtml(
              formatAnalysisStatus(
                game.analysis_status
              )
            )}
          </span>

        </td>


        <td>

          <div class="admin-table-actions">

            <a
              class="admin-action-btn"
              href="game-details.html?game_id=${encodeURIComponent(game.game_id)}"
            >
              View
            </a>


           <button
  class="admin-action-btn delete delete-game-btn"
  type="button"
  data-game-id="${escapeHtml(game.game_id)}"
  data-game-name="${escapeHtml(game.game_name)}"
>
  Delete
</button>

          </div>

        </td>

      `;


      tableBody.appendChild(row);

    });

  }



  /* =========================================
     FILTER
  ========================================= */

  function applyFilters() {

    const searchValue =
      searchInput.value
        .trim()
        .toLowerCase();


    const selectedRisk =
      riskFilter.value.toLowerCase();


    const filteredGames =
      games.filter(game => {

        const gameName =
          String(
            game.game_name || ""
          ).toLowerCase();


        const riskLevel =
          String(
            game.overall_risk_level || "new"
          ).toLowerCase();


        const matchesSearch =
          gameName.includes(searchValue);


        const matchesRisk =
          selectedRisk === "all" ||
          riskLevel === selectedRisk;


        return matchesSearch && matchesRisk;

      });


    renderGames(filteredGames);

  }



  /* =========================================
     LOAD GAMES FROM DATABASE
  ========================================= */

  try {

    const response =
      await fetch("api/games.php");


    const data =
      await response.json();


    if (!data.success) {

      throw new Error(
        data.message ||
        "Unable to load games."
      );

    }


    games =
      data.games || [];


    renderGames(games);


  } catch (error) {

    console.error(error);


    tableBody.innerHTML = `
      <tr>
        <td colspan="7">
          Unable to load games.
        </td>
      </tr>
    `;

  }


function normalizeSearchText(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[™®©]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
  searchInput.addEventListener(
    "input",
    applyFilters
  );


  riskFilter.addEventListener(
    "change",
    applyFilters
  );

  /* =========================================
   ADD GAME MODAL
========================================= */

const addGameBtn =
  document.getElementById("addGameBtn");

const addGameModal =
  document.getElementById("addGameModal");

const closeAddGameModal =
  document.getElementById("closeAddGameModal");

const steamGameSearch =
  document.getElementById("steamGameSearch");

const searchSteamBtn =
  document.getElementById("searchSteamBtn");

const steamSearchResults =
  document.getElementById("steamSearchResults");

const steamSearchMessage =
  document.getElementById("steamSearchMessage");



addGameBtn.addEventListener("click", () => {

  addGameModal.classList.add("show");

  steamGameSearch.focus();

});


closeAddGameModal.addEventListener("click", () => {

  addGameModal.classList.remove("show");

});


addGameModal.addEventListener("click", event => {

  if (event.target === addGameModal) {

    addGameModal.classList.remove("show");

  }

});



async function searchSteamGames() {

  const query =
    steamGameSearch.value.trim();


  if (!query) {

    steamSearchMessage.textContent =
      "Please enter a game name.";

    return;

  }


  steamSearchMessage.textContent =
    "Searching Steam...";

  steamSearchResults.innerHTML = "";


  try {

    const response =
      await fetch(
        `api/admin-games.php?action=search&q=${encodeURIComponent(query)}`
      );


    const data =
      await response.json();


    if (!data.success) {

      throw new Error(
        data.message ||
        "Unable to search Steam."
      );

    }


    steamSearchMessage.textContent = "";


    if (!data.games.length) {

      steamSearchMessage.textContent =
        "No games found.";

      return;

    }


    data.games.forEach(game => {

      const item =
        document.createElement("div");


      item.className =
        "admin-steam-result";


      item.innerHTML = `

        ${
          game.image
            ? `
              <img
                src="${escapeHtml(game.image)}"
                alt="${escapeHtml(game.name)}"
              >
            `
            : ""
        }


        <div class="admin-steam-result-info">

          <h3>
            ${escapeHtml(game.name)}
          </h3>

          <p>
            Steam App ID:
            ${escapeHtml(game.appid)}
          </p>

        </div>


        <button
          class="btn steam-select-game"
          type="button"
          data-appid="${escapeHtml(game.appid)}"
        >
          Select
        </button>

      `;


      steamSearchResults.appendChild(item);

    });


  } catch (error) {

    console.error(error);

    steamSearchMessage.textContent =
      "Unable to search Steam.";

  }

}



searchSteamBtn.addEventListener(
  "click",
  searchSteamGames
);


steamGameSearch.addEventListener(
  "keydown",
  event => {

    if (event.key === "Enter") {

      searchSteamGames();

    }

  }
);

/* =========================================
   SELECT + ADD GAME
========================================= */

steamSearchResults.addEventListener(
  "click",
  async event => {

    const button =
      event.target.closest(
        ".steam-select-game"
      );


    if (!button) {
      return;
    }


    const appid =
      button.dataset.appid;


    if (!appid) {
      return;
    }


    const originalText =
      button.textContent;


    button.disabled = true;

    button.textContent =
      "Adding...";


    steamSearchMessage.textContent =
      "Retrieving game information...";


    try {

      const response =
        await fetch(
          "api/admin-games.php?action=add",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({
              appid: appid
            })
          }
        );


      const data =
        await response.json();


      if (!data.success) {

        throw new Error(
          data.message ||
          "Unable to add game."
        );
      }


      steamSearchMessage.textContent =
        data.message;


      steamSearchResults.innerHTML = "";


      setTimeout(() => {

        window.location.reload();

      }, 900);


    } catch (error) {

      console.error(error);


      steamSearchMessage.textContent =
        error.message ||
        "Unable to add game.";


      button.disabled = false;

      button.textContent =
        originalText;

    }

  }
);

/* =========================================
   DELETE GAME
========================================= */

const deleteGameModal =
  document.getElementById("deleteGameModal");

const deleteGameName =
  document.getElementById("deleteGameName");

const cancelDeleteGame =
  document.getElementById("cancelDeleteGame");

const confirmDeleteGame =
  document.getElementById("confirmDeleteGame");


let selectedGameToDelete = null;



/* =========================================
   OPEN DELETE CONFIRMATION
========================================= */

tableBody.addEventListener(
  "click",
  event => {

    const deleteButton =
      event.target.closest(
        ".delete-game-btn"
      );


    if (!deleteButton) {
      return;
    }


    selectedGameToDelete = {
      game_id:
        deleteButton.dataset.gameId,

      game_name:
        deleteButton.dataset.gameName
    };


    deleteGameName.textContent =
      selectedGameToDelete.game_name;


    deleteGameModal.classList.add(
      "show"
    );
  }
);



/* =========================================
   CANCEL DELETE
========================================= */

cancelDeleteGame.addEventListener(
  "click",
  () => {

    deleteGameModal.classList.remove(
      "show"
    );

    selectedGameToDelete = null;
  }
);



/* Close when clicking outside */

deleteGameModal.addEventListener(
  "click",
  event => {

    if (
      event.target === deleteGameModal
    ) {

      deleteGameModal.classList.remove(
        "show"
      );

      selectedGameToDelete = null;
    }
  }
);



/* =========================================
   CONFIRM DELETE
========================================= */

confirmDeleteGame.addEventListener(
  "click",
  async () => {

    if (!selectedGameToDelete) {
      return;
    }


    const gameId =
      selectedGameToDelete.game_id;


    confirmDeleteGame.disabled =
      true;


    const originalText =
      confirmDeleteGame.textContent;


    confirmDeleteGame.textContent =
      "Deleting...";


    try {

      const response =
        await fetch(
          "api/admin-games.php?action=delete",
          {

            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({
              game_id: gameId
            })

          }
        );


      const data =
        await response.json();


      if (!data.success) {

        throw new Error(
          data.message ||
          "Unable to delete game."
        );
      }


      /* Remove from current local list */

      games =
        games.filter(
          game =>
            String(game.game_id) !==
            String(gameId)
        );


      /* Refresh table */

      applyFilters();


      /* Close modal */

      deleteGameModal.classList.remove(
        "show"
      );


      selectedGameToDelete = null;


    } catch (error) {

      console.error(error);

      alert(
        error.message ||
        "Unable to delete game."
      );


    } finally {

      confirmDeleteGame.disabled =
        false;

      confirmDeleteGame.textContent =
        originalText;
    }

  }
);

});