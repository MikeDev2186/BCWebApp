document.getElementById("signUpButton").addEventListener("click", () => {
  document.getElementById("signIn").style.display = "none";
  document.getElementById("signup").style.display = "block";
});

document.getElementById("signInButton").addEventListener("click", () => {
  document.getElementById("signup").style.display = "none";
  document.getElementById("signIn").style.display = "block";
});

// Show sign-in by default
window.addEventListener("load", () => {
  document.getElementById("signIn").style.display = "block";
  document.getElementById("signup").style.display = "none";
});
