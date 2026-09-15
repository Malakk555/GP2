document.addEventListener(
  "DOMContentLoaded",
  () => {

    const tableBody =
      document.getElementById(
        "adminUsersTable"
      );

    const tabs =
      document.querySelectorAll(
        ".admin-user-tab"
      );

    const searchInput =
      document.getElementById(
        "adminUserSearch"
      );

    const statusFilter =
      document.getElementById(
        "adminUserStatusFilter"
      );

    const sectionTitle =
      document.getElementById(
        "adminUsersSectionTitle"
      );

    const sectionDescription =
      document.getElementById(
        "adminUsersSectionDescription"
      );

    const usersCount =
      document.getElementById(
        "adminUsersCount"
      );


    /* Modal */

    const accountStatusModal =
      document.getElementById(
        "accountStatusModal"
      );

    const accountStatusTitle =
      document.getElementById(
        "accountStatusTitle"
      );

    const accountStatusAction =
      document.getElementById(
        "accountStatusAction"
      );

    const accountStatusUserName =
      document.getElementById(
        "accountStatusUserName"
      );

    const accountStatusDescription =
      document.getElementById(
        "accountStatusDescription"
      );

    const cancelAccountStatus =
      document.getElementById(
        "cancelAccountStatus"
      );

    const confirmAccountStatus =
      document.getElementById(
        "confirmAccountStatus"
      );


    let currentRole =
      "individual";

    let users = [];

    let selectedUser =
      null;



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
       SEARCH NORMALIZATION
    ========================================= */

    function normalizeText(value) {

      return String(value ?? "")
        .toLowerCase()
        .trim();
    }



    /* =========================================
       DATE
    ========================================= */

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



    /* =========================================
       STATUS BADGE
    ========================================= */

    function getStatusBadge(status) {

      const safeStatus =
        String(
          status || "active"
        ).toLowerCase();


      return `
        <span
          class="admin-user-status ${escapeHtml(
            safeStatus
          )}"
        >
          ${escapeHtml(
            safeStatus
          )}
        </span>
      `;
    }



    /* =========================================
       ACTION BUTTON
    ========================================= */

    function getActionButton(user) {

      const status =
        String(
          user.status || "active"
        ).toLowerCase();


      if (status === "active") {

        return `
          <button
            class="admin-action-btn
                   admin-account-action
                   disable"
            type="button"
            data-user-id="${escapeHtml(
              user.user_id
            )}"
          >
            Disable
          </button>
        `;
      }


      return `
        <button
          class="admin-action-btn
                 admin-account-action
                 enable"
          type="button"
          data-user-id="${escapeHtml(
            user.user_id
          )}"
        >
          ${
            status === "pending"
              ? "Activate"
              : "Enable"
          }
        </button>
      `;
    }



    /* =========================================
       SECTION HEADER
    ========================================= */

    function updateSectionHeader() {

      if (
        currentRole === "individual"
      ) {

        sectionTitle.textContent =
          "Individual Users";

        sectionDescription.textContent =
          "Registered individual users on the DIR'A platform.";

      } else if (
        currentRole === "government"
      ) {

        sectionTitle.textContent =
          "Government Employees";

        sectionDescription.textContent =
          "Government employee accounts with access to DIR'A.";

      } else {

        sectionTitle.textContent =
          "Administrators";

        sectionDescription.textContent =
          "Administrator accounts authorized to manage the platform.";
      }
    }



    /* =========================================
       RENDER USERS
    ========================================= */

    function renderUsers(list) {

      tableBody.innerHTML =
        "";


      usersCount.textContent =
        `${list.length} ${
          list.length === 1
            ? "User"
            : "Users"
        }`;


      if (!list.length) {

        tableBody.innerHTML = `
          <tr>
            <td colspan="5">
              No users found.
            </td>
          </tr>
        `;

        return;
      }


      list.forEach(user => {

        const row =
          document.createElement(
            "tr"
          );


        row.innerHTML = `

          <td>

            <div class="admin-user-info">

              <div class="admin-user-avatar">
                👤
              </div>


              <div>

                <strong>
                  ${escapeHtml(
                    user.name
                  )}
                </strong>

                <small>
                  ID:
                  ${escapeHtml(
                    user.user_id
                  )}
                </small>

              </div>

            </div>

          </td>


          <td>
            ${escapeHtml(
              user.email
            )}
          </td>


          <td>
            ${getStatusBadge(
              user.status
            )}
          </td>


          <td>
            ${formatDate(
              user.created_at
            )}
          </td>


          <td>

            <div class="admin-table-actions">

              ${getActionButton(
                user
              )}

            </div>

          </td>

        `;


        tableBody.appendChild(
          row
        );
      });
    }



    /* =========================================
       FILTER
    ========================================= */

    function applyFilters() {

      const searchValue =
        normalizeText(
          searchInput.value
        );


      const selectedStatus =
        statusFilter.value
          .toLowerCase();


      const filteredUsers =
        users.filter(user => {

          const name =
            normalizeText(
              user.name
            );

          const email =
            normalizeText(
              user.email
            );

          const status =
            normalizeText(
              user.status ||
              "active"
            );


          const matchesSearch =
            name.includes(
              searchValue
            ) ||
            email.includes(
              searchValue
            );


          const matchesStatus =
            selectedStatus === "all" ||
            status === selectedStatus;


          return (
            matchesSearch &&
            matchesStatus
          );

        });


      renderUsers(
        filteredUsers
      );
    }



    /* =========================================
       LOAD USERS
    ========================================= */

    async function loadUsers(role) {

      tableBody.innerHTML = `
        <tr>
          <td colspan="5">
            Loading users...
          </td>
        </tr>
      `;


      usersCount.textContent =
        "Loading...";


      try {

        const response =
          await fetch(
            `api/admin-users.php?role=${encodeURIComponent(
              role
            )}`
          );


        const data =
          await response.json();


        if (!data.success) {

          throw new Error(
            data.message ||
            "Unable to load users."
          );
        }


        users =
          data.users || [];


        applyFilters();


      } catch (error) {

        console.error(error);


        users = [];


        usersCount.textContent =
          "0 Users";


        tableBody.innerHTML = `
          <tr>
            <td colspan="5">
              Unable to load users.
            </td>
          </tr>
        `;
      }
    }



    /* =========================================
       TABS
    ========================================= */

    tabs.forEach(tab => {

      tab.addEventListener(
        "click",
        () => {

          tabs.forEach(
            currentTab => {

              currentTab.classList.remove(
                "active"
              );
            }
          );


          tab.classList.add(
            "active"
          );


          currentRole =
            tab.dataset.role;


          searchInput.value =
            "";


          statusFilter.value =
            "all";


          updateSectionHeader();


          loadUsers(
            currentRole
          );

        }
      );

    });



    /* =========================================
       SEARCH EVENTS
    ========================================= */

    searchInput.addEventListener(
      "input",
      applyFilters
    );


    statusFilter.addEventListener(
      "change",
      applyFilters
    );



    /* =========================================
       OPEN ACCOUNT ACTION MODAL
    ========================================= */

    tableBody.addEventListener(
      "click",
      event => {

        const button =
          event.target.closest(
            ".admin-account-action"
          );


        if (!button) {
          return;
        }


        const userId =
          button.dataset.userId;


        const user =
          users.find(
            item =>
              String(
                item.user_id
              ) ===
              String(userId)
          );


        if (!user) {
          return;
        }


        const currentStatus =
          String(
            user.status ||
            "active"
          ).toLowerCase();


        const newStatus =
          currentStatus === "active"
            ? "disabled"
            : "active";


        selectedUser = {
          user_id:
            user.user_id,

          name:
            user.name,

          role:
            user.role,

          current_status:
            currentStatus,

          new_status:
            newStatus
        };


        if (
          newStatus === "disabled"
        ) {

          accountStatusTitle.textContent =
            "Disable Account?";

          accountStatusAction.textContent =
            "disable";

          accountStatusDescription.textContent =
            "The user will no longer be allowed to access their account.";

          confirmAccountStatus.textContent =
            "Disable Account";


          confirmAccountStatus.classList.add(
            "account-disable-confirm"
          );

          confirmAccountStatus.classList.remove(
            "account-enable-confirm"
          );


        } else {

          accountStatusTitle.textContent =
            currentStatus === "pending"
              ? "Activate Account?"
              : "Enable Account?";


          accountStatusAction.textContent =
            currentStatus === "pending"
              ? "activate"
              : "enable";


          accountStatusDescription.textContent =
            "The user will be allowed to access their account.";


          confirmAccountStatus.textContent =
            currentStatus === "pending"
              ? "Activate Account"
              : "Enable Account";


          confirmAccountStatus.classList.add(
            "account-enable-confirm"
          );

          confirmAccountStatus.classList.remove(
            "account-disable-confirm"
          );
        }


        accountStatusUserName.textContent =
          user.name;


        accountStatusModal.classList.add(
          "show"
        );

      }
    );



    /* =========================================
       CANCEL MODAL
    ========================================= */

    cancelAccountStatus.addEventListener(
      "click",
      () => {

        accountStatusModal.classList.remove(
          "show"
        );


        selectedUser =
          null;
      }
    );



    /* Click outside */

    accountStatusModal.addEventListener(
      "click",
      event => {

        if (
          event.target ===
          accountStatusModal
        ) {

          accountStatusModal.classList.remove(
            "show"
          );


          selectedUser =
            null;
        }

      }
    );



    /* =========================================
       CONFIRM STATUS CHANGE
    ========================================= */

    confirmAccountStatus.addEventListener(
      "click",
      async () => {

        if (!selectedUser) {
          return;
        }


        const originalText =
          confirmAccountStatus.textContent;


        confirmAccountStatus.disabled =
          true;


        confirmAccountStatus.textContent =
          selectedUser.new_status ===
          "disabled"
            ? "Disabling..."
            : "Updating...";


        try {

          const response =
            await fetch(
              "api/admin-users.php",
              {

                method: "POST",

                headers: {
                  "Content-Type":
                    "application/json"
                },

                body:
                  JSON.stringify({

                    user_id:
                      selectedUser.user_id,

                    status:
                      selectedUser.new_status

                  })

              }
            );


          const data =
            await response.json();


          if (!data.success) {

            throw new Error(
              data.message ||
              "Unable to update account."
            );
          }



          /* Update local user */

          const userIndex =
            users.findIndex(
              user =>
                String(
                  user.user_id
                ) ===
                String(
                  selectedUser.user_id
                )
            );


          if (userIndex !== -1) {

            users[userIndex].status =
              data.status;
          }



          applyFilters();



          accountStatusModal.classList.remove(
            "show"
          );


          selectedUser =
            null;


        } catch (error) {

          console.error(error);


          alert(
            error.message ||
            "Unable to update account."
          );


        } finally {

          confirmAccountStatus.disabled =
            false;


          confirmAccountStatus.textContent =
            originalText;
        }

      }
    );



    /* =========================================
       INITIAL PAGE
    ========================================= */

    updateSectionHeader();

    loadUsers(
      currentRole
    );

  }
);