import { supabase } from "./supabase.js";

const emailInput = document.getElementById("login-email");
const passwordInput = document.getElementById("login-password");
const loginBtn = document.getElementById("login-btn");
const createBtn = document.getElementById("create-account");
const msg = document.getElementById("login-message");

createBtn.addEventListener("click", () => {
  window.location.href = "signup.html";
});

loginBtn.addEventListener("click", async () => {

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    msg.textContent = "Please enter both email and password.";
    msg.style.color = "red";
    return;
  }

  msg.textContent = "Signing in...";
  msg.style.color = "blue";

  const { data, error } = await supabase.auth.signInWithPassword({
    email, password
  });

  if (error) {
    const m = error.message.toLowerCase();

    if (m.includes("invalid login credentials")) {
      msg.textContent = "Incorrect password.";
      msg.style.color = "red";
      return;
    }

    if (m.includes("email") && m.includes("not found")) {
      msg.textContent = "Account not found. Redirecting...";
      msg.style.color = "red";
      setTimeout(() => window.location.href = "signup.html", 1500);
      return;
    }

    msg.textContent = "Login failed: " + error.message;
    msg.style.color = "red";
    return;
  }

  msg.textContent = "Login successful.";
  msg.style.color = "green";

  setTimeout(() => window.location.href = "profile.html", 500);
});
