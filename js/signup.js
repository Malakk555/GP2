const signupForm = document.getElementById('signupForm');
const signupMessage = document.getElementById('signupMessage');
const signupBtn = document.getElementById('signupBtn');

function showSignupMessage(text, type) {
  signupMessage.hidden = false;
  signupMessage.textContent = text;
  signupMessage.className = `formMessage ${type}`;
}

signupForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const firstName = document.getElementById('firstName').value.trim();
  const lastName = document.getElementById('lastName').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const password = document.getElementById('signupPassword').value;

  if (!firstName || !lastName || !email || !password) {
    showSignupMessage('Please fill in all fields.', 'error');
    return;
  }

  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

if (!passwordRegex.test(password)) {
  showSignupMessage(
    'Password must be at least 8 characters and include both letters and numbers.',
    'error'
  );
  return;
}

  try {
    signupBtn.disabled = true;
    signupBtn.textContent = 'Creating...';

    const response = await fetch('api/register.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        first_name: firstName,
        last_name: lastName,
        email,
        password
      })
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      showSignupMessage(result.message || 'Sign up failed. Please try again.', 'error');
      return;
    }

    localStorage.setItem('diraUser', JSON.stringify(result.user));
    showSignupMessage('Account created successfully. Redirecting...', 'success');


    setTimeout(() => {
    window.location.href = 'home.html';
    }, 900);
  } catch (error) {
    showSignupMessage('Cannot connect to the server. Make sure Apache and MySQL are running in XAMPP.', 'error');
  } finally {
    signupBtn.disabled = false;
    signupBtn.textContent = 'Sign Up';
  }
});
