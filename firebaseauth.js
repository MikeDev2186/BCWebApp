import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/11.7.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/11.7.1/firebase-storage.js";

// Firebase config (keep your existing keys)
const firebaseConfig = {
  apiKey: "AIzaSyCMZKXMBzr_m7RcI-_kXocACYxBAvyOCBo",
  authDomain: "npwebapp-c9ee3.firebaseapp.com",
  projectId: "npwebapp-c9ee3",
  storageBucket: "npwebapp-c9ee3.appspot.com",
  messagingSenderId: "149339991351",
  appId: "1:149339991351:web:72ca48b9c31ad2054abeb2",
  measurementId: "G-X761ZGHTSH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Utility functions
export function showMessage(message, divId) {
  const messageDiv = document.getElementById(divId);
  if (messageDiv) {
    messageDiv.innerText = message;
    messageDiv.style.display = "block";
    messageDiv.style.opacity = 1;
    setTimeout(() => {
      messageDiv.style.opacity = 0;
      setTimeout(() => { messageDiv.style.display = "none"; }, 400);
    }, 4000);
  } else {
    alert(message);
  }
}

export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// File upload helper
export async function uploadDocument(userId, file) {
  const fileRef = ref(storage, `documents/${userId}/${file.name}`);
  await uploadBytes(fileRef, file);
  return await getDownloadURL(fileRef);
}

// Registration logic for register.html
export async function registerMember(form, errorDivId, successDivId) {
  const errorDiv = document.getElementById(errorDivId);
  const successDiv = document.getElementById(successDivId);

  // Hide previous messages
  errorDiv.style.display = "none";
  errorDiv.innerText = "";
  successDiv.style.display = "none";
  successDiv.innerText = "";

  // Get form values
  const email = form.email.value.trim();
  const password = form.password.value;
  const firstName = form.firstName.value.trim();
  const lastName = form.lastName.value.trim();
  const middleName = form.middleName.value.trim();
  const suffix = form.suffix.value;
  const birthMonth = form.birthMonth.value;
  const birthDay = form.birthDay.value;
  const birthYear = form.birthYear.value;
  const sex = form.sex.value;
  const mobileNumber = form.mobileNumber.value.trim();
  const city = form.city.value;
  const barangay = form.barangay.value;
  const houseNumber = form.houseNumber.value.trim();
  const street = form.street.value.trim();
  const workingInQC = form.workingInQC.value;
  const occupation = form.occupation.value.trim();
  const fileInput = form.validDocument;

  // Validation
  if (!email || !email.includes("@")) {
    errorDiv.innerText = "A valid email address is required.";
    errorDiv.style.display = "block";
    return;
  }
  if (!password || password.length < 6) {
    errorDiv.innerText = "Password is required and must be at least 6 characters.";
    errorDiv.style.display = "block";
    return;
  }
  if (barangay !== "COMMONWEALTH") {
    errorDiv.innerText = "Only residents of Barangay Commonwealth can register.";
    errorDiv.style.display = "block";
    return;
  }
  if (!fileInput.files || fileInput.files.length === 0) {
    errorDiv.innerText = "You must upload a valid ID or birth certificate.";
    errorDiv.style.display = "block";
    return;
  }

  try {
    // Show loading
    successDiv.innerText = "Registering, please wait...";
    successDiv.style.display = "block";
    successDiv.style.background = "#eaf7ea";
    successDiv.style.color = "#134b62";

    // Firebase Auth: create user
    const signUpResult = await createUserWithEmailAndPassword(auth, email, password);
    const user = signUpResult.user;

    // Upload document
    let validDocumentURL = "";
    if (fileInput.files.length > 0) {
      validDocumentURL = await uploadDocument(user.uid, fileInput.files[0]);
    }

    // Save member data to Firestore
    const memberData = {
      email,
      firstName,
      lastName,
      middleName,
      suffix,
      birthDate: `${birthMonth} ${birthDay}, ${birthYear}`,
      sex,
      mobileNumber,
      city,
      barangay,
      houseNumber,
      street,
      workingInQC,
      occupation,
      validDocumentURL,
      createdAt: new Date().toISOString(),
      role: "member"
    };

    await setDoc(doc(db, "users", user.uid), memberData);
    await setDoc(doc(db, "members", user.uid), memberData);

    // Show success and redirect
    successDiv.innerText = "Registration successful! Redirecting to Privacy Agreement...";
    successDiv.style.display = "block";
    setTimeout(function() {
      window.location.href = "https://brgycommonwealthportal.netlify.app/privacy-agreement.html";
    }, 2000);
  } catch (error) {
    errorDiv.innerText = "Failed to create account: " + (error.message || error);
    errorDiv.style.display = "block";
    successDiv.style.display = "none";
  }
}
