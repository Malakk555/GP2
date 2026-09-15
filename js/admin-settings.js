document.addEventListener(
  "DOMContentLoaded",
  () => {

    const profileForm =
      document.getElementById(
        "adminProfileForm"
      );

    const passwordForm =
      document.getElementById(
        "adminPasswordForm"
      );


    const nameInput =
      document.getElementById(
        "adminSettingName"
      );

    const emailInput =
      document.getElementById(
        "adminSettingEmail"
      );


    const profileMessage =
      document.getElementById(
        "profileMessage"
      );

    const passwordMessage =
      document.getElementById(
        "passwordMessage"
      );


    const saveProfileBtn =
      document.getElementById(
        "saveProfileBtn"
      );

    const changePasswordBtn =
      document.getElementById(
        "changePasswordBtn"
      );



    /* =========================================
       MESSAGE
    ========================================= */

    function showMessage(
      element,
      text,
      type
    ) {

      element.hidden =
        false;

      element.textContent =
        text;

      element.className =
        `formMessage ${type}`;
    }



    /* =========================================
       LOAD PROFILE
    ========================================= */

    async function loadProfile() {

      try {

        const response =
          await fetch(
            "api/admin-settings.php"
          );


        const data =
          await response.json();


        if (!data.success) {

          throw new Error(
            data.message ||
            "Unable to load account."
          );
        }


        nameInput.value =
          data.user.name || "";

        emailInput.value =
          data.user.email || "";


      } catch (error) {

        console.error(error);


        showMessage(
          profileMessage,
          error.message ||
          "Unable to load account information.",
          "error"
        );
      }
    }



    /* =========================================
       UPDATE PROFILE
    ========================================= */

    profileForm.addEventListener(
      "submit",
      async event => {

        event.preventDefault();


        const name =
          nameInput.value.trim();

        const email =
          emailInput.value.trim();


        if (!name || !email) {

          showMessage(
            profileMessage,
            "Please enter name and email.",
            "error"
          );

          return;
        }


        try {

          saveProfileBtn.disabled =
            true;

          saveProfileBtn.textContent =
            "Saving...";


          const response =
            await fetch(
              "api/admin-settings.php",
              {

                method: "POST",

                headers: {
                  "Content-Type":
                    "application/json"
                },

                body:
                  JSON.stringify({

                    action:
                      "update_profile",

                    name:
                      name,

                    email:
                      email

                  })

              }
            );


          const data =
            await response.json();


          if (!data.success) {

            throw new Error(
              data.message ||
              "Unable to update profile."
            );
          }


          showMessage(
            profileMessage,
            data.message,
            "success"
          );



          /* Update localStorage */

          const savedUser =
            JSON.parse(
              localStorage.getItem(
                "diraUser"
              ) || "{}"
            );


          savedUser.name =
            data.user.name;

          savedUser.email =
            data.user.email;


          localStorage.setItem(
            "diraUser",
            JSON.stringify(
              savedUser
            )
          );


        } catch (error) {

          console.error(error);


          showMessage(
            profileMessage,
            error.message,
            "error"
          );


        } finally {

          saveProfileBtn.disabled =
            false;

          saveProfileBtn.textContent =
            "Save Changes";
        }

      }
    );



    /* =========================================
       CHANGE PASSWORD
    ========================================= */

    passwordForm.addEventListener(
      "submit",
      async event => {

        event.preventDefault();


        const currentPassword =
          document.getElementById(
            "currentPassword"
          ).value;


        const newPassword =
          document.getElementById(
            "newPassword"
          ).value;


        const confirmPassword =
          document.getElementById(
            "confirmPassword"
          ).value;



        if (
          !currentPassword ||
          !newPassword ||
          !confirmPassword
        ) {

          showMessage(
            passwordMessage,
            "Please complete all password fields.",
            "error"
          );

          return;
        }


        if (
          newPassword !==
          confirmPassword
        ) {

          showMessage(
            passwordMessage,
            "New passwords do not match.",
            "error"
          );

          return;
        }


        if (
          newPassword.length < 8
        ) {

          showMessage(
            passwordMessage,
            "Password must be at least 8 characters.",
            "error"
          );

          return;
        }


        try {

          changePasswordBtn.disabled =
            true;

          changePasswordBtn.textContent =
            "Updating...";


          const response =
            await fetch(
              "api/admin-settings.php",
              {

                method: "POST",

                headers: {
                  "Content-Type":
                    "application/json"
                },

                body:
                  JSON.stringify({

                    action:
                      "change_password",

                    current_password:
                      currentPassword,

                    new_password:
                      newPassword

                  })

              }
            );


          const data =
            await response.json();


          if (!data.success) {

            throw new Error(
              data.message ||
              "Unable to change password."
            );
          }


          showMessage(
            passwordMessage,
            data.message,
            "success"
          );


          passwordForm.reset();


        } catch (error) {

          console.error(error);


          showMessage(
            passwordMessage,
            error.message,
            "error"
          );


        } finally {

          changePasswordBtn.disabled =
            false;

          changePasswordBtn.textContent =
            "Change Password";
        }

      }
    );



    loadProfile();

  }
);