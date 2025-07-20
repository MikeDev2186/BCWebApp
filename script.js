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

// Handle extension field logic
document.getElementById("extension").addEventListener("change", (event) => {
  const extensionOther = document.getElementById("extensionOther");
  if (event.target.value === "Other") {
    extensionOther.style.display = "block";
  } else {
    extensionOther.style.display = "none";
  }
});

// Handle middle name checkbox logic
document.getElementById("noMiddleName").addEventListener("change", (event) => {
  const middleNameInput = document.getElementById("middleName");
  if (event.target.checked) {
    middleNameInput.value = "";
    middleNameInput.disabled = true;
  } else {
    middleNameInput.disabled = false;
  }
});

// Handle employment details visibility
document.getElementById("employed").addEventListener("change", (event) => {
  const employmentDetails = document.getElementById("employmentDetails");
  if (event.target.value === "Yes") {
    employmentDetails.style.display = "block";
  } else {
    employmentDetails.style.display = "none";
  }
});
