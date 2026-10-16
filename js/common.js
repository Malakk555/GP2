document.addEventListener('DOMContentLoaded', () => {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) e.target.classList.add('show');
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.animate,.bubble,.orb,.card,.stat,.dashBox,.metric')
    .forEach(el => obs.observe(el));

  document.querySelectorAll('[data-year]')
    .forEach(el => el.textContent = new Date().getFullYear());

  document.querySelectorAll('a').forEach(link => {
    if (link.textContent.trim().toLowerCase() === 'log out') {
      link.addEventListener('click', () => {
        localStorage.removeItem('diraUser');
      });
    }
  });

  const savedTheme = localStorage.getItem('diraTheme');

  if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
  } else {
    document.body.classList.remove('dark-mode');
    localStorage.setItem('diraTheme', 'light');
  }

    const navAvatarMap = {
    default: "👤",
    cat: "🐱",
    lion: "🦁",
    rabbit: "🐰",
    owl: "🦉",
    duck: "🦆",
    turtle: "🐢",
    bear: "🐻"
  };

  const savedAvatar = localStorage.getItem("profile_avatar");

  document.querySelectorAll(".profileIcon").forEach(icon => {
    icon.textContent = navAvatarMap[savedAvatar] || navAvatarMap.default;
  });

  updateThemeIcon();
});

function toggleTheme() {
  document.body.classList.toggle('dark-mode');

  if (document.body.classList.contains('dark-mode')) {
    localStorage.setItem('diraTheme', 'dark');
  } else {
    localStorage.setItem('diraTheme', 'light');
  } 

  updateThemeIcon();
}

function updateThemeIcon() {
  const themeButtons = document.querySelectorAll('button[onclick="toggleTheme()"]');

  themeButtons.forEach(button => {
    if (document.body.classList.contains('dark-mode')) {
      button.textContent = '☀';
      button.setAttribute('aria-label', 'Switch to light mode');
      button.setAttribute('title', 'Switch to light mode');
    } else {
      button.textContent = '🌙';
      button.setAttribute('aria-label', 'Switch to dark mode');
      button.setAttribute('title', 'Switch to dark mode');
    }
  });
}


/* =========================
   AUTH GUARDIAN SCENES
========================= */

document.addEventListener(
  'DOMContentLoaded',
  () => {

    if (
      !document.body.classList.contains(
        'authPage'
      )
    ) {
      return;
    }


    const dirGuardian =
      document.getElementById(
        'dirGuardian'
      );


    if (!dirGuardian) {
      return;
    }


    const scenes = [
      'auth-peek',
      'auth-wave'
    ];


    let lastScene = null;
    let guardianTimer = null;



    function clearGuardianScene() {

      scenes.forEach(scene => {

        dirGuardian.classList.remove(
          scene
        );

      });

    }



    function playGuardianScene(
      forcedScene = null
    ) {

      clearTimeout(guardianTimer);

      clearGuardianScene();


      let scene = forcedScene;


      if (!scene) {

        const availableScenes =
          scenes.filter(
            item => item !== lastScene
          );


        scene =
          availableScenes[
            Math.floor(
              Math.random() *
              availableScenes.length
            )
          ];

      }


      lastScene = scene;


      void dirGuardian.offsetWidth;


      dirGuardian.classList.add(
        scene
      );


      const duration =
        scene === 'auth-wave'
          ? 4800
          : 4600;


      guardianTimer =
        setTimeout(
          () => {

            clearGuardianScene();


            guardianTimer =
              setTimeout(
                () => {
                  playGuardianScene();
                },

                3500 +
                Math.random() * 3500
              );

          },

          duration
        );

    }



    /* أول ظهور */
    setTimeout(
      () => {

        playGuardianScene(
          'auth-peek'
        );

      },

      1000
    );



    /* يتفاعل مع اختيار الحساب */
    window.addEventListener(
  'dira:role-selected',
  (event) => {

    const role = event.detail?.role;

    /* نوقف حركة الـpeek / wave المؤقتة */
    clearTimeout(guardianTimer);
    clearGuardianScene();

    /* نخليه ظاهر وثابت */
    dirGuardian.classList.add(
      'auth-role-active'
    );

    /* نشيل الحالة السابقة */
    dirGuardian.classList.remove(
      'auth-individual',
      'auth-employee'
    );

    if (role === 'individual') {
      dirGuardian.classList.add(
        'auth-individual'
      );
    }

    if (role === 'employee') {
      dirGuardian.classList.add(
        'auth-employee'
      );
    }

  }
);

  }
);

function applyRoleNavigation() {

  const storedUser = localStorage.getItem('diraUser');

  if (!storedUser) {
    return;
  }

  let user;

  try {
    user = JSON.parse(storedUser);
  } catch {
    return;
  }

  const role = user.role;

  const linksContainer =
    document.querySelector('.nav .links');

  const logo =
    document.querySelector('.nav .logo');

  if (!linksContainer) {
    return;
  }

  if (role === 'employee') {

    if (logo) {
      logo.href = 'government-dashboard.html';
    }

    linksContainer.innerHTML = `
      <a href="government-dashboard.html">
        Home
      </a>

      <a href="games.html">
        Games
      </a>

      <a href="tracked-games.html">
        My List
      </a>

      <a
  class="btn logoutLink"
  href="#"
>
  Log Out
</a>

      <button
        onclick="toggleTheme()"
        class="icon"
        type="button"
      >
        🌙
      </button>

      <a
        class="icon profileIcon"
        href="profile.html"
      >
        👤
      </a>
    `;
  }

  if (role === 'admin') {

  if (logo) {
    logo.href = 'admin-dashboard.html';
  }

  linksContainer.innerHTML = `
    <a href="admin-dashboard.html">
      Dashboard
    </a>

    <a href="admin-games.html">
      Games
    </a>

    <a href="admin-users.html">
      Users
    </a>

    <a href="admin-complaints.html">
      Complaints
    </a>

    <a href="admin-settings.html">
      Settings
    </a>

    <a
      class="btn logoutLink"
      href="#"
    >
      Log Out
    </a>

    <button
      onclick="toggleTheme()"
      class="icon"
      type="button"
    >
      🌙
    </button>
  `;
}

}

document.addEventListener('DOMContentLoaded', () => {

  applyRoleNavigation();

  setActiveNavLink();

});

document.addEventListener('click', async (event) => {

  const logoutLink =
    event.target.closest('.logoutLink');

  if (!logoutLink) {
    return;
  }

  event.preventDefault();

  try {
    await fetch('api/logout.php');
  } catch (error) {
    console.error('Logout request failed:', error);
  }

  localStorage.removeItem('diraUser');

  window.location.href = 'main-home.html';

});

function setActiveNavLink() {

  const currentPage =
    window.location.pathname.split('/').pop();

  const navLinks =
    document.querySelectorAll('.nav .links a');

  navLinks.forEach(link => {
    link.classList.remove('active');
  });

  navLinks.forEach(link => {

    const linkPage =
      link.getAttribute('href');

    if (linkPage === currentPage) {
      link.classList.add('active');
    }

  });

  const storedUser =
    localStorage.getItem('diraUser');

  if (!storedUser) {
    return;
  }

  let user;

  try {
    user = JSON.parse(storedUser);
  } catch {
    return;
  }

  if (
    user.role === 'admin' &&
    currentPage === 'game-details.html'
  ) {

    const gamesLink =
      document.querySelector(
        '.nav .links a[href="admin-games.html"]'
      );

    if (gamesLink) {
      gamesLink.classList.add('active');
    }
  }

  if (
  user.role === 'employee' &&
  currentPage === 'game-details.html'
) {

  const gamesLink =
    document.querySelector(
      '.nav .links a[href="games.html"]'
    );

  if (gamesLink) {
    gamesLink.classList.add('active');
  }
}
}



// Called when an API answers "Not logged in": the browser still thinks the
// user is logged in (localStorage) but the server session is gone.
function handleSessionExpired(data) {
  const msg = String((data && data.message) || '').toLowerCase();
  if (data && data.success === false && msg.includes('not logged in')) {
    localStorage.removeItem('diraUser');
    alert('Your session has expired. Please log in again.');
    window.location.href = 'login.html';
    return true;
  }
  return false;
}
