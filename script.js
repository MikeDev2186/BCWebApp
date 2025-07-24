// Toggle between Sign Up and Sign In
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

// Extension field logic
document.getElementById("extension").addEventListener("change", (event) => {
  const extensionOther = document.getElementById("extensionOther");
  extensionOther.style.display = event.target.value === "Other" ? "block" : "none";
});

// Middle name checkbox logic
document.getElementById("noMiddleName").addEventListener("change", (event) => {
  const middleNameInput = document.getElementById("middleName");
  middleNameInput.disabled = event.target.checked;
  if (event.target.checked) middleNameInput.value = "";
});

// Employment details visibility
document.getElementById("employed").addEventListener("change", (event) => {
  const employmentDetails = document.getElementById("employmentDetails");
  employmentDetails.style.display = event.target.value === "Yes" ? "block" : "none";
});

// Privacy Agreement toggle
function togglePrivacyAgreement(event) {
  event.preventDefault();
  const agreement = document.getElementById("privacyAgreement");
  agreement.style.display = agreement.style.display === "none" ? "block" : "none";
}

// Registration logic
document.getElementById("registerForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const fName = document.getElementById("fName").value.trim();
  const lName = document.getElementById("lName").value.trim();
  const email = document.getElementById("rEmail").value.trim();
  const barangay = document.getElementById("barangay").value;
  const password = document.getElementById("rPassword").value;
  const documentFile = document.getElementById("validDocument").files[0];
  const privacyAgreed = document.getElementById("privacyCheck").checked;

  const messageDiv = document.getElementById("signUpMessage");
  messageDiv.style.display = "none";
  messageDiv.textContent = "";

  if (!privacyAgreed) {
    messageDiv.style.display = "block";
    messageDiv.textContent = "You must agree to the Privacy Agreement.";
    return;
  }

  // Firebase registration
  firebase.auth().createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      messageDiv.style.display = "block";
      messageDiv.textContent = "Registration successful!";
      // Optional: Save additional user data to Firestore or Realtime DB
    })
    .catch((error) => {
      messageDiv.style.display = "block";
      messageDiv.textContent = error.message;
    });
});
