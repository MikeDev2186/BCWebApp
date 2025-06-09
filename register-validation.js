document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById('registerForm');

  form.addEventListener('submit', function (e) {
    const barangay = document.getElementById('barangay').value;
    const fileInput = document.getElementById('validDocument');
    const messageDiv = document.getElementById('signUpMessage');
    messageDiv.style.display = "none";
    messageDiv.innerText = "";

    if (barangay !== "Commonwealth") {
      e.preventDefault();
      messageDiv.innerText = "Only residents of Barangay Commonwealth can register.";
      messageDiv.style.display = "block";
      return;
    }

    if (fileInput.files.length === 0) {
      e.preventDefault();
      messageDiv.innerText = "You must upload a valid ID or birth certificate.";
      messageDiv.style.display = "block";
      return;
    }
  });
});
