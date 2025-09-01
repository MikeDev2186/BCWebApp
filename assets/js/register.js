// assets/js/register.js
// Multi-step form controller with optional Firebase hookup.
// This script will try to call a global function `window.firebaseCreateUser(payload)` if present.
// If that function is not available, we fall back to a simulated submit for demo purposes.

document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('registerForm');
  const steps = Array.from(form.querySelectorAll('.form-step'));
  const nextBtn = document.getElementById('nextBtn');
  const prevBtn = document.getElementById('prevBtn');
  const progressBar = document.querySelector('.progress-bar');
  let current = 0;

  function showStep(i){
    steps.forEach((s, idx)=> s.hidden = idx !== i);
    prevBtn.hidden = i === 0;
    nextBtn.textContent = (i === steps.length - 1) ? 'Submit' : 'Next';
    const pct = Math.round(((i+1)/steps.length)*100);
    progressBar.style.width = pct + '%';
    current = i;
  }

  nextBtn.addEventListener('click', function(){
    if(current < steps.length - 1){
      // Basic required field check for visible inputs/selects
      const requiredFields = Array.from(steps[current].querySelectorAll('input[required], select[required]'));
      const invalid = requiredFields.some(i => !i.value || (i.type === 'file' && i.files.length === 0));
      if(invalid){
        // focus first invalid
        const firstInvalid = requiredFields.find(i => !i.value || (i.type === 'file' && i.files.length === 0));
        if(firstInvalid) firstInvalid.focus();
        return;
      }
      showStep(current + 1);
    } else {
      // final submit
      handleSubmit();
    }
  });

  prevBtn.addEventListener('click', function(){ showStep(Math.max(0, current - 1)); });

  // Initialize floating label behavior: add placeholder so :placeholder-shown works
  document.querySelectorAll('.input-group input, .input-group select').forEach(el=>{
    if(el.tagName.toLowerCase() === 'input' && !el.placeholder) el.placeholder = ' ';
  });

  showStep(0);

  // Helper to collect form data from the fields used in the form
  function collectFormData(){
    const get = id => (document.getElementById(id) ? document.getElementById(id).value : '');
    const fileEl = document.getElementById('validDocument');
    return {
      email: get('email') || get('rEmail') || get('emailSign') || '',
      password: (document.getElementById('rPassword') && document.getElementById('rPassword').value) || '',
      profile: {
        firstName: get('firstName') || get('fName') || '',
        lastName: get('lastName') || get('lName') || '',
        middleName: get('middleName') || '',
        dob: get('dob') || '',
        sex: get('sex') || '',
        mobile: get('mobile') || '',
        province: get('province') || '',
        city: get('city') || '',
        barangay: get('barangayField') || get('barangay') || '',
        street: get('street') || '',
        houseNumber: get('houseNumber') || '',
        isEmployed: get('isEmployed') || '',
        nationality: get('nationality') || ''
      },
      file: (fileEl && fileEl.files && fileEl.files[0]) ? fileEl.files[0] : null
    };
  }

  async function handleSubmit(){
    // Minimal front-end validation before attempting registration
    const emailEl = document.getElementById('email') || document.getElementById('rEmail');
    const pwdEl = document.getElementById('rPassword');
    if(emailEl && !emailEl.value){ emailEl.focus(); return; }
    if(pwdEl && !pwdEl.value){ pwdEl.focus(); return; }

    const payload = collectFormData();

    // If an integration point exists, call it. This lets firebaseauth.js (or another module) implement the actual Firebase logic.
    if(typeof window.firebaseCreateUser === 'function'){
      try{
        nextBtn.disabled = true;
        nextBtn.textContent = 'Submitting...';

        // firebaseCreateUser should return a Promise and handle:
        // - createUserWithEmailAndPassword
        // - sendEmailVerification
        // - upload document to Storage (if payload.file provided)
        // - save user profile in Firestore
        // The function signature expected here: firebaseCreateUser(payload) -> Promise
        await window.firebaseCreateUser(payload);

        alert('Registration successful. Check your email for verification.');
        form.reset();
        showStep(0);
      }catch(err){
        console.error('Firebase registration error:', err);
        // Provide a friendly message. If err.message exists show it.
        alert('Registration failed: ' + (err && err.message ? err.message : 'An error occurred.'));
      }finally{
        nextBtn.disabled = false;
        nextBtn.textContent = 'Submit';
      }
    } else {
      // Fallback: simulated submit (keeps current behavior for demo)
      nextBtn.disabled = true;
      nextBtn.textContent = 'Submitting...';
      setTimeout(()=>{
        alert('Registration submitted (demo).');
        nextBtn.disabled = false;
        nextBtn.textContent = 'Submit';
        form.reset();
        showStep(0);
      }, 800);
    }
  }

});