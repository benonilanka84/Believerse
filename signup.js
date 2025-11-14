import { supabase } from "./supabase.js";

const btn = document.getElementById("signup-btn");
const msg = document.getElementById("signup-message");

const emailInput = document.getElementById("signup-email");
const passInput = document.getElementById("signup-password");

const agree1 = document.getElementById("agree-1");
const agree2 = document.getElementById("agree-2");

function validatePassword(p) {
  const regex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
  return regex.test(p);
}

function toggleSignup() {
  btn.disabled = !(agree1.checked && agree2.checked);
}

agree1.addEventListener("change", toggleSignup);
agree2.addEventListener("change", toggleSignup);

btn.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const password = passInput.value.trim();
  const first = document.getElementById("first_name").value.trim();
  const last = document.getElementById("last_name").value.trim();

  if (!email || !password || !first || !last) {
    msg.textContent = "Please complete all fields.";
    msg.style.color = "red";
    return;
  }

  if (!validatePassword(password)) {
    msg.textContent =
      "Password must be 8+ chars with upper, lower, number, and special char.";
    msg.style.color = "red";
    return;
  }

  msg.textContent = "Creating account...";
  msg.style.color = "blue";

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    msg.textContent = "Signup error: " + error.message;
    msg.style.color = "red";
    return;
  }

  // INSERT PROFILE ROW
  await supabase.from("profiles").insert({
    id: data.user.id,
    email: email,
    full_name: `${first} ${last}`,
  });

  msg.textContent = "Account created! Redirecting...";
  msg.style.color = "green";

  setTimeout(() => {
    window.location.href = "profile.html";
  }, 1500);
});
