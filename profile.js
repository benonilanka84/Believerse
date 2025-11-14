import { supabase } from "./supabase.js";

const msg = document.getElementById("profile-message");
const saveBtn = document.getElementById("save-profile");
const logoutBtn = document.getElementById("logout-btn");

let user = null;

async function loadUser() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    window.location.href = "index.html";
    return;
  }
  user = data.user;
  loadProfile();
}

async function loadProfile() {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!error && data) {
    document.getElementById("full_name").value = data.full_name || "";
    document.getElementById("username").value = data.username || "";
    document.getElementById("bio").value = data.bio || "";
    document.getElementById("country").value = data.country || "";
    document.getElementById("church").value = data.church || "";
    document.getElementById("faith_journey").value = data.faith_journey || "";
    document.getElementById("gender").value = data.gender || "Prefer not to say";
    document.getElementById("dob").value = data.dob || "";
    if (data.avatar_url) {
      document.getElementById("avatar-preview").src = data.avatar_url;
    }
  }
}

saveBtn.addEventListener("click", async () => {
  const username = document.getElementById("username").value.trim();

  // UNIQUE CHECK
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username);

  if (existing && existing.length > 0 && existing[0].id !== user.id) {
    msg.textContent = "Username already taken.";
    msg.style.color = "red";
    return;
  }

  const update = {
    full_name: document.getElementById("full_name").value.trim(),
    username,
    bio: document.getElementById("bio").value.trim(),
    country: document.getElementById("country").value.trim(),
    church: document.getElementById("church").value.trim(),
    faith_journey: document.getElementById("faith_journey").value.trim(),
    gender: document.getElementById("gender").value,
    dob: document.getElementById("dob").value,
    updated_at: new Date(),
  };

  const { error } = await supabase
    .from("profiles")
    .update(update)
    .eq("id", user.id);

  if (error) {
    msg.textContent = "Error saving: " + error.message;
    msg.style.color = "red";
    return;
  }

  msg.textContent = "Profile updated!";
  msg.style.color = "green";
});

logoutBtn.addEventListener("click", async () => {
  await supabase.auth.signOut();
  window.location.href = "index.html";
});

loadUser();
