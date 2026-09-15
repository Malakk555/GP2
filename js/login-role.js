
const loginForm = document.getElementById('loginForm');
const loginMessage = document.getElementById('loginMessage');
const loginBtn = document.getElementById('loginBtn');

function showLoginMessage(text, type) {
  loginMessage.hidden = false;
  loginMessage.textContent = text;
  loginMessage.className = `formMessage authMessage ${type}`;
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  if (!email || !password) {
    showLoginMessage('Please enter email and password.', 'error');
    return;
  }

  try {
    loginBtn.disabled = true;
    loginBtn.textContent = 'Checking...';

    const response = await fetch('api/login.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const result = await response.json();
    
    if (!response.ok || !result.success) {
      showLoginMessage(
        result.message || 'Incorrect email or password.',
        'error'
      );
      return;
    }

    localStorage.setItem(
      'diraUser',
      JSON.stringify(result.user)
    );

    showLoginMessage(
      'Login successful. Redirecting...',
      'success'
    );

    setTimeout(() => {

      const role = result.user?.role;

      if (role === 'admin') {
        window.location.href =
          'admin-dashboard.html';

      } else if (role === 'government') {
        window.location.href =
          'government-dashboard.html';

      } else {
        window.location.href =
          'home.html';
      }

    }, 700);

  } catch (error) {

    showLoginMessage(
      'Cannot connect to the server. Make sure Apache and MySQL are running in XAMPP.',
      'error'
    );

  } finally {

    loginBtn.disabled = false;
    loginBtn.innerHTML = 'Log In <span>→</span>';
  }
});