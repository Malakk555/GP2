document.addEventListener(
  "DOMContentLoaded",
  () => {

    const tableBody =
      document.getElementById(
        "complaintsTable"
      );

    const searchInput =
      document.getElementById(
        "complaintSearch"
      );

    const complaintsCount =
      document.getElementById(
        "complaintsCount"
      );


    const modal =
      document.getElementById(
        "complaintModal"
      );

    const closeModal =
      document.getElementById(
        "closeComplaintModal"
      );


    let complaints = [];



    /* =========================
       ESCAPE
    ========================== */

    function escapeHtml(value) {

      return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }



    /* =========================
       DATE
    ========================== */

    function formatDate(value) {

      if (!value) {
        return "—";
      }


      const date =
        new Date(
          String(value)
            .replace(" ", "T")
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



    /* =========================
       BEHAVIORS
    ========================== */

    function getBehaviors(complaint) {

      const behaviors = [];


      if (
        Number(
          complaint.behavior_toxic
        ) === 1
      ) {
        behaviors.push(
          "Other Toxicity"
        );
      }


      if (
        Number(
          complaint.behavior_bullying
        ) === 1
      ) {
        behaviors.push(
          "Bullying"
        );
      }


      if (
        Number(
          complaint.behavior_hate
        ) === 1
      ) {
        behaviors.push(
          "Hate Speech"
        );
      }


      if (
        Number(
          complaint.behavior_sexual
        ) === 1
      ) {
        behaviors.push(
          "Sexual Harassment"
        );
      }


      if (
        Number(
          complaint.behavior_threat
        ) === 1
      ) {
        behaviors.push(
          "Threat"
        );
      }


      if (
        complaint.behavior_other &&
        complaint.behavior_other.trim()
      ) {
        behaviors.push(
          "Other"
        );
      }


      return behaviors.length
        ? behaviors.join(", ")
        : "—";
    }



    /* =========================
       LOCATION
    ========================== */

    function getLocations(complaint) {

      const locations = [];


      if (
        Number(
          complaint.location_chat
        ) === 1
      ) {
        locations.push("Chat");
      }


      if (
        Number(
          complaint.location_gameplay
        ) === 1
      ) {
        locations.push("Gameplay");
      }


      if (
        Number(
          complaint.location_community
        ) === 1
      ) {
        locations.push(
          "Community"
        );
      }


      return locations.length
        ? locations.join(", ")
        : "—";
    }



    /* =========================
       RENDER
    ========================== */

    function renderComplaints(list) {

      tableBody.innerHTML =
        "";


      complaintsCount.textContent =
        `${list.length} ${
          list.length === 1
            ? "Complaint"
            : "Complaints"
        }`;


      if (!list.length) {

        tableBody.innerHTML = `
          <tr>
            <td colspan="7">
              No complaints found.
            </td>
          </tr>
        `;

        return;
      }


      list.forEach(
        complaint => {

          const row =
            document.createElement(
              "tr"
            );


          const severity =
            String(
              complaint.severity ||
              "—"
            );


          row.innerHTML = `

            <td>

              <strong>
                ${escapeHtml(
                  complaint.title ||
                  "Untitled Complaint"
                )}
              </strong>

            </td>


            <td>

              ${escapeHtml(
                complaint.game_name ||
                "Unknown Game"
              )}

            </td>


            <td>

              ${escapeHtml(
                complaint.user_name ||
                "Unknown User"
              )}

            </td>


            <td>

              ${escapeHtml(
                getBehaviors(
                  complaint
                )
              )}

            </td>


            <td>

              <span
                class="risk-badge ${escapeHtml(
                  severity.toLowerCase()
                )}"
              >
                ${escapeHtml(
                  severity
                )}
              </span>

            </td>


            <td>

              ${formatDate(
                complaint.date_reported
              )}

            </td>


            <td>

              <div class="admin-table-actions">

                <button
                  class="admin-action-btn view-complaint"
                  type="button"
                  data-id="${complaint.report_id}"
                >
                  View
                </button>


                <button
                  class="admin-action-btn delete delete-complaint"
                  type="button"
                  data-id="${complaint.report_id}"
                >
                  Delete
                </button>

              </div>

            </td>

          `;


          tableBody.appendChild(
            row
          );

        }
      );

    }



    /* =========================
       SEARCH
    ========================== */

    function applySearch() {

      const query =
        searchInput.value
          .trim()
          .toLowerCase();


      const filtered =
        complaints.filter(
          complaint => {

            const text = [

              complaint.title,
              complaint.game_name,
              complaint.user_name,
              complaint.user_email,
              getBehaviors(
                complaint
              )

            ]
              .join(" ")
              .toLowerCase();


            return text.includes(
              query
            );

          }
        );


      renderComplaints(
        filtered
      );
    }



    /* =========================
       VIEW
    ========================== */

    function openComplaint(
      complaint
    ) {

      document.getElementById(
        "modalComplaintTitle"
      ).textContent =
        complaint.title ||
        "Complaint";


      document.getElementById(
        "modalGame"
      ).textContent =
        complaint.game_name ||
        "—";


      document.getElementById(
        "modalUser"
      ).textContent =
        complaint.user_name ||
        "—";


      document.getElementById(
        "modalEmail"
      ).textContent =
        complaint.user_email ||
        "—";


      document.getElementById(
        "modalStatus"
      ).textContent =
        complaint.status ||
        "—";


      document.getElementById(
        "modalBehavior"
      ).textContent =
        getBehaviors(
          complaint
        );


      document.getElementById(
        "modalSeverity"
      ).textContent =
        complaint.severity ||
        "—";


      document.getElementById(
        "modalLocation"
      ).textContent =
        getLocations(
          complaint
        );


      document.getElementById(
        "modalDate"
      ).textContent =
        formatDate(
          complaint.date_reported
        );


      const otherBox =
        document.getElementById(
          "otherBehaviorBox"
        );


      const otherText =
        document.getElementById(
          "modalOther"
        );


      if (
        complaint.behavior_other &&
        complaint.behavior_other.trim()
      ) {

        otherBox.hidden =
          false;

        otherText.textContent =
          complaint.behavior_other;

      } else {

        otherBox.hidden =
          true;

        otherText.textContent =
          "";
      }


      modal.classList.add(
        "show"
      );
    }



    /* =========================
       TABLE ACTIONS
    ========================== */

    tableBody.addEventListener(
      "click",
      async event => {

        const viewButton =
          event.target.closest(
            ".view-complaint"
          );


        if (viewButton) {

          const complaint =
            complaints.find(
              item =>
                String(
                  item.report_id
                ) ===
                String(
                  viewButton.dataset.id
                )
            );


          if (complaint) {

            openComplaint(
              complaint
            );
          }


          return;
        }



        const deleteButton =
          event.target.closest(
            ".delete-complaint"
          );


        if (!deleteButton) {
          return;
        }


        const id =
          deleteButton.dataset.id;


        const complaint =
          complaints.find(
            item =>
              String(
                item.report_id
              ) ===
              String(id)
          );


        if (!complaint) {
          return;
        }


        const confirmed =
          confirm(
            `Delete complaint "${complaint.title}"?`
          );


        if (!confirmed) {
          return;
        }


        try {

          const response =
            await fetch(
              "api/admin-complaints.php",
              {

                method: "POST",

                headers: {
                  "Content-Type":
                    "application/json"
                },

                body:
                  JSON.stringify({
                    action:
                      "delete",

                    report_id:
                      complaint.report_id
                  })

              }
            );


          const data =
            await response.json();


          if (!data.success) {

            throw new Error(
              data.message ||
              "Unable to delete complaint."
            );
          }


          complaints =
            complaints.filter(
              item =>
                String(
                  item.report_id
                ) !==
                String(
                  complaint.report_id
                )
            );


          applySearch();


        } catch (error) {

          console.error(
            error
          );


          alert(
            error.message ||
            "Unable to delete complaint."
          );
        }

      }
    );



    /* =========================
       MODAL CLOSE
    ========================== */

    closeModal.addEventListener(
      "click",
      () => {

        modal.classList.remove(
          "show"
        );

      }
    );


    modal.addEventListener(
      "click",
      event => {

        if (
          event.target === modal
        ) {

          modal.classList.remove(
            "show"
          );
        }

      }
    );



    /* =========================
       SEARCH EVENT
    ========================== */

    searchInput.addEventListener(
      "input",
      applySearch
    );



    /* =========================
       LOAD
    ========================== */

    async function loadComplaints() {

      try {

        const response =
          await fetch(
            "api/admin-complaints.php"
          );


        const data =
          await response.json();


        if (!data.success) {

          throw new Error(
            data.message ||
            "Unable to load complaints."
          );
        }


        complaints =
          data.complaints || [];


        renderComplaints(
          complaints
        );


      } catch (error) {

        console.error(
          error
        );


        tableBody.innerHTML = `
          <tr>
            <td colspan="7">
              Unable to load complaints.
            </td>
          </tr>
        `;

      }

    }


    loadComplaints();

  }
);