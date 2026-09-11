document.addEventListener("DOMContentLoaded", () => {
  const role = localStorage.getItem("role"); 
  const header = document.getElementById("header");

  const navLinks = {
    parent: `
      <a href="home.html">Home</a>
      <a href="games.html">Games</a>
      <a href="comparison.html">Compare</a>
      <a href="tracked-games.html">Tracked Games</a>
      <a href="recommendations.html">Recommendations</a>
      <a href="my-reports.html">My Reports</a>
      <a href="profile.html">Profile</a>
    `,

    government: `
      <a href="home.html">Dashboard</a>
      <a href="games.html">Games Monitoring</a>
      <a href="game-details.html">Risk Details</a>
      <a href="my-reports.html">Reports</a>
      <a href="profile.html">Profile</a>
    `,

    admin: `
      <a href="admin-dashboard.html">Admin Dashboard</a>
      <a href="users.html">User Management</a>
      <a href="government-requests.html">Government Access</a>
      <a href="profile.html">Profile</a>
    `,

    guest: `
      <a href="main-home.html">Home</a>
      <a href="about.html">About</a>
      <a href="login.html" class="btn light">Login</a>
      <a href="signup.html" class="btn">Sign Up</a>
    `
  };

  header.innerHTML = `
    <div class="nav">
      <a href="main-home.html" class="logo">
        <img src="images/dira-logo.png" alt="Dir'a Logo" class="logo-img">
      </a>

      <div class="links">
        ${navLinks[role] || navLinks.guest}
        ${role ? `<a href="#" id="logoutBtn" class="btn light">Logout</a>` : ""}
      </div>
    </div>
  `;

  const footer = document.getElementById("footer");
  if (footer) {
    footer.innerHTML = `
      <div class="footer">
        <div class="mini">© 2026 Dir'a Platform — All Rights Reserved</div>
      </div>
    `;
  }

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("role");
      window.location.href = "login.html";
    });
  }
});