document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById('registerForm');
  const messageDiv = document.getElementById('signUpMessage');

  // Real-time validation functions
  function validateField(fieldId, validationFn, errorMessage) {
    const field = document.getElementById(fieldId);
    if (!field) return;

    function validate() {
      const isValid = validationFn(field.value);
      const existingError = field.parentNode.querySelector('.error-text');
      const existingSuccess = field.parentNode.querySelector('.success-text');
      
      // Remove existing validation messages
      if (existingError) existingError.remove();
      if (existingSuccess) existingSuccess.remove();
      
      // Remove existing validation classes
      field.classList.remove('field-error', 'field-success');
      
      if (field.value.trim() === '') {
        // Empty field - neutral state
        return;
      }
      
      if (isValid) {
        field.classList.add('field-success');
        const successSpan = document.createElement('span');
        successSpan.className = 'success-text';
        successSpan.textContent = '✓ Valid';
        field.parentNode.appendChild(successSpan);
      } else {
        field.classList.add('field-error');
        const errorSpan = document.createElement('span');
        errorSpan.className = 'error-text';
        errorSpan.textContent = errorMessage;
        field.parentNode.appendChild(errorSpan);
      }
    }

    field.addEventListener('input', validate);
    field.addEventListener('blur', validate);
  }

  // Validation rules
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^(\+63|0)[0-9]{10}$/;
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;

  // Apply real-time validation to fields
  validateField('fName', value => value.trim().length >= 2, 'First name must be at least 2 characters');
  validateField('lName', value => value.trim().length >= 2, 'Last name must be at least 2 characters');
  validateField('middleName', value => value.trim().length >= 2 || value.trim().length === 0, 'Middle name must be at least 2 characters');
  validateField('rEmail', value => emailRegex.test(value), 'Please enter a valid email address');
  validateField('alternateEmail', value => value.trim() === '' || emailRegex.test(value), 'Please enter a valid email address');
  validateField('personalMobile', value => phoneRegex.test(value.replace(/\s/g, '')), 'Phone must be in format +63XXXXXXXXXX or 09XXXXXXXXX');
  validateField('username', value => usernameRegex.test(value), 'Username must be 3-20 characters, letters, numbers, and underscore only');
  
  // Password validation with strength indicator
  const passwordField = document.getElementById('rPassword');
  if (passwordField) {
    function validatePassword() {
      const password = passwordField.value;
      const existingError = passwordField.parentNode.querySelector('.error-text');
      const existingSuccess = passwordField.parentNode.querySelector('.success-text');
      
      if (existingError) existingError.remove();
      if (existingSuccess) existingSuccess.remove();
      passwordField.classList.remove('field-error', 'field-success');
      
      if (password === '') return;
      
      const hasLength = password.length >= 8;
      const hasUpper = /[A-Z]/.test(password);
      const hasLower = /[a-z]/.test(password);
      const hasNumber = /\d/.test(password);
      const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
      
      const strengthCount = [hasLength, hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
      
      let message = '';
      let isValid = false;
      
      if (!hasLength) {
        message = 'Password must be at least 8 characters';
      } else if (strengthCount < 3) {
        message = 'Password is weak. Include uppercase, lowercase, numbers, and symbols';
      } else if (strengthCount < 4) {
        message = 'Password is moderate. Consider adding more character types';
        passwordField.classList.add('field-success');
        isValid = true;
      } else {
        message = '✓ Strong password';
        passwordField.classList.add('field-success');
        isValid = true;
      }
      
      const span = document.createElement('span');
      span.className = isValid ? 'success-text' : 'error-text';
      span.textContent = message;
      passwordField.parentNode.appendChild(span);
      
      // Validate confirm password if it has a value
      validateConfirmPassword();
    }
    
    passwordField.addEventListener('input', validatePassword);
    passwordField.addEventListener('blur', validatePassword);
  }

  // Confirm password validation
  function validateConfirmPassword() {
    const confirmField = document.getElementById('confirmPassword');
    const passwordField = document.getElementById('rPassword');
    if (!confirmField || !passwordField) return;

    const password = passwordField.value;
    const confirmPassword = confirmField.value;
    
    const existingError = confirmField.parentNode.querySelector('.error-text');
    const existingSuccess = confirmField.parentNode.querySelector('.success-text');
    
    if (existingError) existingError.remove();
    if (existingSuccess) existingSuccess.remove();
    confirmField.classList.remove('field-error', 'field-success');
    
    if (confirmPassword === '') return;
    
    const isMatch = password === confirmPassword;
    const span = document.createElement('span');
    
    if (isMatch && password !== '') {
      confirmField.classList.add('field-success');
      span.className = 'success-text';
      span.textContent = '✓ Passwords match';
    } else {
      confirmField.classList.add('field-error');
      span.className = 'error-text';
      span.textContent = 'Passwords do not match';
    }
    
    confirmField.parentNode.appendChild(span);
  }

  const confirmPasswordField = document.getElementById('confirmPassword');
  if (confirmPasswordField) {
    confirmPasswordField.addEventListener('input', validateConfirmPassword);
    confirmPasswordField.addEventListener('blur', validateConfirmPassword);
  }

  // Form submission validation
  form.addEventListener('submit', function (e) {
    const barangay = document.getElementById('presentBarangay').value;
    const fileInput = document.getElementById('validDocument');
    const password = document.getElementById('rPassword')?.value || '';
    const confirmPassword = document.getElementById('confirmPassword')?.value || '';
    const username = document.getElementById('username')?.value || '';
    const email = document.getElementById('rEmail')?.value || '';
    
    messageDiv.style.display = "none";
    messageDiv.innerText = "";
    messageDiv.className = "messageDiv";

    // Check required fields
    const errors = [];

    if (!username || !usernameRegex.test(username)) {
      errors.push("Please enter a valid username (3-20 characters, letters, numbers, underscore only)");
    }

    if (!email || !emailRegex.test(email)) {
      errors.push("Please enter a valid email address");
    }

    if (!password || password.length < 8) {
      errors.push("Password must be at least 8 characters long");
    }

    if (password !== confirmPassword) {
      errors.push("Passwords do not match");
    }

    if (barangay !== "Commonwealth") {
      errors.push("Only residents of Barangay Commonwealth can register");
    }

    if (fileInput.files.length === 0) {
      errors.push("You must upload a valid ID or birth certificate");
    }

    if (errors.length > 0) {
      e.preventDefault();
      messageDiv.className = "messageDiv error";
      messageDiv.innerText = errors.join(". ");
      messageDiv.style.display = "block";
      return;
    }
  });

  // Show success message function (to be called from firebaseauth.js)
  window.showRegistrationSuccess = function(message) {
    messageDiv.className = "messageDiv success";
    messageDiv.innerText = message || "Registration successful! Welcome to Barangay Commonwealth!";
    messageDiv.style.display = "block";
    
    // Scroll to top to show the message
    document.querySelector('#signup').scrollIntoView({ behavior: 'smooth' });
  };
});
