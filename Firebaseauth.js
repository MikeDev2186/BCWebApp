import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js";

// Firebase config
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

// Helper to show messages
function showMessage(message, divId) {
  const messageDiv = document.getElementById(divId);
  if (messageDiv) {
    messageDiv.innerText = message;
    messageDiv.style.display = "block";
    messageDiv.style.opacity = 1;
    setTimeout(() => {
      messageDiv.style.opacity = 0;
    }, 4000);
  }
}

// Sign Up
document.getElementById("submitSignUp").addEventListener("click", async (event) => {
  event.preventDefault();

  const email = document.getElementById("rEmail").value.trim();
  const password = document.getElementById("rPassword").value;
  const firstName = document.getElementById("fName").value.trim();
  const lastName = document.getElementById("lName").value.trim();

  try {
    const signUpResult = await createUserWithEmailAndPassword(auth, email, password);
    const user = signUpResult.user;

    // Set role as 'member' by default
    const role = "member"; 

    await setDoc(doc(db, "users", user.uid), {
      email,
      firstName,
      lastName,
      role // Adding the role to Firestore
    });

    showMessage("Account Created Successfully", "signUpMessage");
    setTimeout(() => {
      window.location.href = "index.html"; // Redirect after sign-up
    }, 1000);
  } catch (error) {
    if (error.code === "auth/email-already-in-use") {
      showMessage("Email already exists!", "signUpMessage");
    } else {
      showMessage("Error: " + error.message, "signUpMessage");
    }
  }
});

// Sign In
document.getElementById("submitSignIn").addEventListener("click", async (event) => {
  event.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Fetch the user's role from Firestore
    const userDoc = await getDoc(doc(db, "users", user.uid));

    if (userDoc.exists()) {
      const userData = userDoc.data();
      const role = userData.role; // Get the role from the Firestore document

      // Redirect based on the role
      if (role === "admin") {
        window.location.href = "admin-dashboard.html"; // Admin dashboard page
      } else {
        window.location.href = "user-dashboard.html"; // Regular user dashboard page
      }
    } else {
      showMessage("User not found in the database", "signInMessage");
    }

    showMessage("Login Successful", "signInMessage");
  } catch (error) {
    if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
      showMessage("Invalid email or password", "signInMessage");
    } else {
      showMessage("Error: " + error.message, "signInMessage");
    }
  }
});
