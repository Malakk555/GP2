document.addEventListener(
  "DOMContentLoaded",
  async () => {

    const totalGames =
      document.getElementById(
        "adminTotalGames"
      );

    const totalUsers =
      document.getElementById(
        "adminTotalUsers"
      );

    const totalEmployees =
      document.getElementById(
        "adminTotalEmployees"
      );

    const totalReports =
      document.getElementById(
        "adminTotalReports"
      );


    const recentGamesTable =
      document.getElementById(
        "adminRecentGames"
      );

    const recentUsersTable =
      document.getElementById(
        "adminRecentUsers"
      );



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
       FORMAT DATE
    ========================================= */

    function formatDate(value) {

      if (!value) {
        return "—";
      }


      const date =
        new Date(
          String(value).replace(" ", "T")
        );


      if (isNaN(date)) {
        return value;
      }


      return date.toLocaleDateString(
        "en-GB",
        {
          day: "2-digit",
          month: "short",
          year: "numeric"
        }
      );
    }



    /* =========================================
       GAME BADGE
    ========================================= */

    function gameRiskBadge(game) {

      const isNew =
        game.analysis_status ===
          "no_comments" ||
        game.overall_risk_level ===
          "New";


      if (isNew) {

        return `
          <span class="pill new-pill">
            New
          </span>
        `;
      }


      const level =
        String(
          game.overall_risk_level ||
          "Low"
        ).toLowerCase();


      return `
        <span class="pill risk-${level}">
          ${escapeHtml(
            game.overall_risk_level ||
            "Low"
          )}
        </span>
      `;
    }



    /* =========================================
       LOAD DASHBOARD
    ========================================= */

    try {

      const response =
        await fetch(
          "api/admin-dashboard.php"
        );


      const data =
        await response.json();


      if (!data.success) {

        throw new Error(
          data.message ||
          "Unable to load dashboard."
        );
      }



      /* =========================================
         SUMMARY
      ========================================= */

      totalGames.textContent =
        data.summary.total_games || 0;


      totalUsers.textContent =
        data.summary.total_users || 0;


      totalEmployees.textContent =
        data.summary.total_employees || 0;


      totalReports.textContent =
        data.summary.total_reports || 0;



      /* =========================================
         RECENT GAMES
      ========================================= */

      recentGamesTable.innerHTML = "";


      if (
        !data.recent_games ||
        !data.recent_games.length
      ) {

        recentGamesTable.innerHTML = `
          <tr>
            <td colspan="4">
              No games found.
            </td>
          </tr>
        `;

      } else {

        data.recent_games.forEach(
          game => {

            const row =
              document.createElement(
                "tr"
              );


            row.innerHTML = `

              <td>

                <div class="admin-game-info">

                  ${
                    game.image_url
                      ? `
                        <img
                          class="admin-game-image"
                          src="${escapeHtml(
                            game.image_url
                          )}"
                          alt="${escapeHtml(
                            game.game_name
                          )}"
                        >
                      `
                      : `
                        <div class="admin-game-image-placeholder">
                          🎮
                        </div>
                      `
                  }

                  <strong>
                    ${escapeHtml(
                      game.game_name
                    )}
                  </strong>

                </div>

              </td>


              <td>
                ${escapeHtml(
                  game.genre || "—"
                )}
              </td>


              <td>
                ${gameRiskBadge(game)}
              </td>


              <td>
                ${
                  game.analysis_status ===
                  "analyzed"
                    ? "Analyzed"
                    : "No Analysis"
                }
              </td>

            `;


            recentGamesTable.appendChild(
              row
            );

          }
        );
      }



      /* =========================================
         RECENT USERS
      ========================================= */

      recentUsersTable.innerHTML = "";


      if (
        !data.recent_users ||
        !data.recent_users.length
      ) {

        recentUsersTable.innerHTML = `
          <tr>
            <td colspan="4">
              No users found.
            </td>
          </tr>
        `;

      } else {

        data.recent_users.forEach(
          user => {

            const row =
              document.createElement(
                "tr"
              );


            const status =
              String(
                user.status || "active"
              ).toLowerCase();


            row.innerHTML = `

              <td>
                <strong>
                  ${escapeHtml(
                    user.name
                  )}
                </strong>
              </td>


              <td>
                ${escapeHtml(
                  user.email
                )}
              </td>


              <td>
                <span
                  class="admin-user-status ${escapeHtml(
                    status
                  )}"
                >
                  ${escapeHtml(
                    user.status ||
                    "active"
                  )}
                </span>
              </td>


              <td>
                ${formatDate(
                  user.created_at
                )}
              </td>

            `;


            recentUsersTable.appendChild(
              row
            );

          }
        );
      }


    } catch (error) {

      console.error(error);


      recentGamesTable.innerHTML = `
        <tr>
          <td colspan="4">
            Unable to load dashboard.
          </td>
        </tr>
      `;


      recentUsersTable.innerHTML = `
        <tr>
          <td colspan="4">
            Unable to load dashboard.
          </td>
        </tr>
      `;
    }

  }
);س