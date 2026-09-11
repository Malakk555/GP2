const guardian = document.getElementById("dirGuardian");

if (guardian) {
  const head = guardian.querySelector(".guardian-head-wrap");
  const leftEye = guardian.querySelector(".guardian-eye-left");
  const rightEye = guardian.querySelector(".guardian-eye-right");

  const eyes = [leftEye, rightEye];

  /* =========================
     HEAD + EYES FOLLOW MOUSE
  ========================= */

  document.addEventListener("mousemove", (event) => {

    /* في صفحات الـAuth، لما درع يكون مشغول
   باللعب أو العمل، ما يتابع الماوس */
if (
  document.body.classList.contains("authPage") &&
  (
    guardian.classList.contains("auth-individual") ||
    guardian.classList.contains("auth-employee")
  )
) {
  return;
}

    const rect = guardian.getBoundingClientRect();

    // مركز الروبوت الحقيقي
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = event.clientX - centerX;
    const dy = event.clientY - centerY;

    // نحدد الحركة عشان ما يلف بزيادة
    const normalizedX = Math.max(-1, Math.min(1, dx / 350));
    const normalizedY = Math.max(-1, Math.min(1, dy / 300));

    // حركة الرأس
    const moveX = normalizedX * 4;
    const moveY = normalizedY * 3;
    const rotate = normalizedX * 5;

    if (
  !guardian.classList.contains("guardian-high-hide") &&
  !guardian.classList.contains("guardian-high-peek")
) {
  head.style.transform =
    `translate(${moveX}px, ${moveY}px) rotate(${rotate}deg)`;
}

    // حركة العيون
    const eyeX = normalizedX * 4;
    const eyeY = normalizedY * 2.5;

    eyes.forEach((eye) => {
      eye.style.transform =
        `translate(${eyeX}px, ${eyeY}px)`;
    });
  });




  /* =========================
     NATURAL BLINK
  ========================= */

  function blink() {
    eyes.forEach((eye) => {
      eye.classList.add("guardian-blink");
    });

    setTimeout(() => {
      eyes.forEach((eye) => {
        eye.classList.remove("guardian-blink");
      });
    }, 130);

    const nextBlink =
      2800 + Math.random() * 3500;

    setTimeout(blink, nextBlink);
  }

  setTimeout(blink, 1800);
}

/* =========================
   GUARDIAN REACTIONS
========================= */

function guardianReact(type) {
  if (!guardian) return;

  if (highReactionRunning) return;

  const symbol = guardian.querySelector("#guardianSymbol");

if (symbol) {
  symbol.textContent = "";
}

  // نشيل أي رياكشن قديم
  guardian.classList.remove(
    "guardian-low",
    "guardian-medium",
    "guardian-high"
  );

  if (type === "low") {
  guardian.classList.add("guardian-low");
}

if (type === "medium") {
  guardian.classList.add("guardian-medium");

  if (symbol) {
    symbol.textContent = "?";
  }
}

if (type === "high") {
  guardian.classList.add("guardian-high");

  if (symbol) {
    symbol.textContent = "!";
  }

  startHighReaction();
}
}

function guardianIdle() {
  if (!guardian) return;

  if (highReactionRunning) return;

  guardian.classList.remove(
    "guardian-low",
    "guardian-medium",
    "guardian-high",
    "guardian-high-hide",
    "guardian-high-peek"
  );

  const symbol = guardian.querySelector("#guardianSymbol");

  if (symbol) {
    symbol.textContent = "";
  }
}

let highReactionRunning = false;
let highTimers = [];

function clearHighTimers() {
  highTimers.forEach((timer) => clearTimeout(timer));
  highTimers = [];
}

function startHighReaction() {
  if (!guardian || highReactionRunning) return;

  highReactionRunning = true;
  clearHighTimers();

  const symbol = guardian.querySelector("#guardianSymbol");

  guardian.classList.remove(
    "guardian-high-hide",
    "guardian-high-peek"
  );

  guardian.classList.add("guardian-high");

  if (symbol) {
    symbol.textContent = "!";
  }

  // بعد الصدمة والاهتزاز يبدأ يختبئ
  highTimers.push(
    setTimeout(() => {
      guardian.classList.remove("guardian-high");
      guardian.classList.add("guardian-high-hide");

      if (symbol) {
        symbol.textContent = "";
      }
    }, 950)
  );

  // بعدين يطل من الطرف
  highTimers.push(
    setTimeout(() => {
      guardian.classList.remove("guardian-high-hide");
      guardian.classList.add("guardian-high-peek");
    }, 1450)
  );

  // يرجع طبيعي
  highTimers.push(
    setTimeout(() => {
      guardian.classList.remove(
        "guardian-high",
        "guardian-high-hide",
        "guardian-high-peek"
      );

      if (symbol) {
        symbol.textContent = "";
      }

      highReactionRunning = false;
    }, 2800)
  );
}


/* =========================
   GAMES CARD INTERACTIONS
========================= */

const gamesGrid = document.getElementById("gamesGrid");

if (gamesGrid) {

  gamesGrid.addEventListener("mouseover", (event) => {
    const card = event.target.closest(".card");

    if (!card) return;

    const risk = card.dataset.risk;

    if (risk === "low") {
  guardianReact("low");
}

if (risk === "medium") {
  guardianReact("medium");
}

if (risk === "high") {
  guardianReact("high");
}
  });


  gamesGrid.addEventListener("mouseout", (event) => {
    const card = event.target.closest(".card");

    if (!card) return;

    // نتأكد إن الماوس خرج من الكارد فعلًا
    if (card.contains(event.relatedTarget)) return;

    guardianIdle();
  });

}