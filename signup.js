// Enable Sign Up button only when both checkboxes are checked

const chk1 = document.getElementById("agree_terms");
const chk2 = document.getElementById("agree_christian");
const btn = document.getElementById("signup-btn");

function updateButton() {
  if (chk1.checked && chk2.checked) {
    btn.disabled = false;
    btn.classList.add("enabled");
  } else {
    btn.disabled = true;
    btn.classList.remove("enabled");
  }
}

chk1.addEventListener("change", updateButton);
chk2.addEventListener("change", updateButton);
