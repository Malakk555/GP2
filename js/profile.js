const firstNameInput = document.getElementById("firstName");
const lastNameInput = document.getElementById("lastName");
const emailInput = document.getElementById("email");
const message = document.getElementById("profileMessage");
const saveBtn = document.getElementById("saveProfileBtn");

async function loadProfile() {
  const res = await fetch("api/profile.php");
  const data = await res.json();

  if (!data.success) {
    message.textContent = "Cannot load profile.";
    return;
  }

  const user = data.user;
  const nameParts = user.name.split(" ");

  firstNameInput.value = nameParts[0] || "";
  lastNameInput.value = nameParts.slice(1).join(" ") || "";
  emailInput.value = user.email || "";
  setAvatar(user.profile_avatar || "default");
  document.getElementById("joinDate").value =
    user.created_at.split(" ")[0];
}

saveBtn.addEventListener("click", async function (e) {
  e.preventDefault();

  const formData = new FormData();
formData.append("first_name", firstNameInput.value.trim());
formData.append("last_name", lastNameInput.value.trim());
formData.append("profile_avatar", selectedAvatar);

  const res = await fetch("api/profile.php", {
    method: "POST",
    body: formData
  });

  const data = await res.json();

if (data.success) {
  localStorage.setItem("profile_avatar", selectedAvatar);
  showToast("Profile updated successfully");

  setTimeout(() => {
    window.location.href = "home.html";
  }, 2000);

} else {
  showToast(data.message || "Error updating profile");
}

});

const avatarMap = {
  default: "👤",
  cat: "🐱",
  lion: "🦁",
  rabbit: "🐰",
  owl: "🦉",
  duck: "🦆",
  turtle: "🐢",
  bear: "🐻"
};

let selectedAvatar = "default";

function setAvatar(value) {
  selectedAvatar = value || "default";
  document.getElementById("profileAvatar").textContent =
    avatarMap[selectedAvatar] || avatarMap.default;
}

document.getElementById("openAvatarModal").addEventListener("click", () => {
  document.getElementById("avatarModal").classList.add("show");
});

document.getElementById("closeAvatarModal").addEventListener("click", () => {
  document.getElementById("avatarModal").classList.remove("show");
});

document.querySelectorAll(".avatarOption").forEach(btn => {
  btn.addEventListener("click", () => {
    setAvatar(btn.dataset.avatar);
    document.getElementById("avatarModal").classList.remove("show");
  });
});

function showToast(message) {
  const toast = document.getElementById("toast");

  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

loadProfile();