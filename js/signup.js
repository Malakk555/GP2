const signupForm = document.getElementById('signupForm');
const signupMessage = document.getElementById('signupMessage');
const signupBtn = document.getElementById('signupBtn');

const accountTypeCards = document.querySelectorAll('.accountTypeCard');
const signupFields = document.getElementById('signupFields');

const accountTypeSection =
  document.querySelector('.authAccountTypeSection');

const changeRoleBtn =
  document.getElementById('changeRoleBtn');

const selectedRoleLabel =
  document.getElementById('selectedRoleLabel');

const emailLabel =
  document.getElementById('emailLabel');

const signupEmail =
  document.getElementById('signupEmail');

const employeeEmailHint =
  document.getElementById('employeeEmailHint');

let selectedRole = null;



function showSignupMessage(text, type) {

  signupMessage.hidden = false;

  signupMessage.textContent = text;

  signupMessage.className =
    `formMessage authMessage ${type}`;
}



function revealFields(role) {

  signupFields.hidden = false;


  requestAnimationFrame(() => {

    signupFields.classList.add('is-visible');

  });


  accountTypeSection.classList.add('role-selected');


  selectedRoleLabel.textContent =
    role === 'employee'
      ? 'Employee account details'
      : 'Individual account details';



  if (role === 'employee') {

    emailLabel.textContent = 'Work Email';

    signupEmail.placeholder =
      'Enter your organization email';

    employeeEmailHint.hidden = false;

  }

  else {

    emailLabel.textContent = 'Email';

    signupEmail.placeholder =
      'Enter your email';

    employeeEmailHint.hidden = true;

  }



  setTimeout(() => {

    signupFields.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest'
    });

  }, 160);

}



/* =========================
   ACCOUNT TYPE
========================= */

accountTypeCards.forEach(card => {
  card.addEventListener('click', () => {

    selectedRole = card.dataset.role;

    accountTypeCards.forEach(item => {
      item.classList.remove('selected');
    });

    card.classList.add('selected');

    signupFields.hidden = false;
    signupMessage.hidden = true;

    requestAnimationFrame(() => {
      signupFields.classList.add('is-visible');
    });

    /* EMPLOYEE */
    if (selectedRole === 'employee') {

      emailLabel.textContent = 'Work email';

      signupEmail.placeholder =
        'name@gmedia.gov.sa';

      employeeEmailHint.textContent =
        'Use your official @gmedia.gov.sa email address. Other email domains are not accepted.';

      employeeEmailHint.hidden = false;

    }

    /* INDIVIDUAL */
    else {

      emailLabel.textContent = 'Email';

      signupEmail.placeholder =
        'Enter your email';

      employeeEmailHint.hidden = true;

    }

    window.dispatchEvent(
      new CustomEvent('dira:role-selected', {
        detail: {
          role: selectedRole
        }
      })
    );

  });
});



/* =========================
   CHANGE ACCOUNT TYPE
========================= */

if (changeRoleBtn) {

  changeRoleBtn.addEventListener('click', () => {


    selectedRole = null;


    accountTypeCards.forEach(item => {

      item.classList.remove('selected');

    });


    signupFields.classList.remove('is-visible');


    accountTypeSection.classList.remove(
      'role-selected'
    );


    document.body.removeAttribute(
      'data-auth-role'
    );



    setTimeout(() => {

      signupFields.hidden = true;


      accountTypeSection.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });

    }, 220);

  });

}



/* =========================
   SUBMIT SIGNUP
========================= */

signupForm.addEventListener(
  'submit',
  async (event) => {


    event.preventDefault();



    if (!selectedRole) {

      showSignupMessage(
        'Please choose an account type.',
        'error'
      );

      return;

    }



    const firstName =
      document
        .getElementById('firstName')
        .value
        .trim();


    const lastName =
      document
        .getElementById('lastName')
        .value
        .trim();


    const email =
      signupEmail.value.trim();


    const password =
      document
        .getElementById('signupPassword')
        .value;



    if (
      !firstName ||
      !lastName ||
      !email ||
      !password
    ) {

      showSignupMessage(
        'Please fill in all fields.',
        'error'
      );

      return;

    }



    if (
      selectedRole === 'employee' &&
      !/^[A-Z0-9._%+-]+@gmedia\.gov\.sa$/i.test(email)
    ) {

      showSignupMessage(
        'Employee accounts must use an official @gmedia.gov.sa email address.',
        'error'
      );

      return;
    }



    const passwordRegex =
      /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;



    if (!passwordRegex.test(password)) {

      showSignupMessage(

        'Password must be at least 8 characters and include both letters and numbers.',

        'error'

      );

      return;

    }



    try {


      signupBtn.disabled = true;

      signupBtn.innerHTML =
        'Creating...';



      const response =
        await fetch(
          'api/register.php',
          {

            method: 'POST',

            headers: {
              'Content-Type':
                'application/json'
            },

            body: JSON.stringify({

              first_name: firstName,

              last_name: lastName,

              email,

              password,

              role: selectedRole

            })

          }
        );



      const result =
        await response.json();



      if (
        !response.ok ||
        !result.success
      ) {

        showSignupMessage(

          result.message ||
          'Sign up failed. Please try again.',

          'error'

        );

        return;

      }



      if (result.requires_approval) {

        localStorage.removeItem('diraUser');

        showSignupMessage(
          result.message ||
          'Your employee access request has been sent to the administrator for approval.',
          'success'
        );

        signupForm.reset();

        setTimeout(() => {
          window.location.href = 'login.html';
        }, 1800);

        return;
      }



      localStorage.setItem(
        'diraUser',
        JSON.stringify(result.user)
      );



      showSignupMessage(
        'Account created successfully. Redirecting...',
        'success'
      );



      setTimeout(() => {

        window.location.href =
          'home.html';

      }, 900);


    }

    catch (error) {


      showSignupMessage(

        'Cannot connect to the server. Make sure Apache and MySQL are running in XAMPP.',

        'error'

      );

    }

    finally {


      signupBtn.disabled = false;


      signupBtn.innerHTML =
        'Create Account <span>→</span>';

    }

  }
);