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


