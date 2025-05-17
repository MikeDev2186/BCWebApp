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

// Helper to collect beneficiary data
function getBeneficiaries() {
  const container = document.getElementById("beneficiaries");
  if (!container) return [];

  const groups = container.querySelectorAll(".form-group");
  const beneficiaries = [];

  groups.forEach(group => {
    const name = group.querySelector('[name="beneficiaryName"]')?.value || "";
    const relationship = group.querySelector('[name="beneficiaryRelationship"]')?.value || "";
    const age = group.querySelector('[name="beneficiaryAge"]')?.value || "";
    const pwd = group.querySelector('[name="beneficiaryPWD"]')?.checked || false;
    const senior = group.querySelector('[name="beneficiarySenior"]')?.checked || false;

    if (name && relationship && age) {
      beneficiaries.push({ name, relationship, age: parseInt(age), pwd, senior });
    }
  });

  return beneficiaries;
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

    const role = "member";

    // Save to "users" collection
    await setDoc(doc(db, "users", user.uid), {
      email,
      firstName,
      lastName,
      role
    });

    // Additional Profile Data
    const phone = document.getElementById("phone")?.value || "";
    const address = document.getElementById("address")?.value || "";
    const dob = document.getElementById("dob")?.value || "";
    const maritalStatus = document.getElementById("maritalStatus")?.value || "";
    const beneficiaries = getBeneficiaries();

    // Save full profile to "members" collection
    await setDoc(doc(db, "members", user.uid), {
      email,
      firstName,
      lastName,
      phone,
      address,
      dob,
      maritalStatus,
      beneficiaries,
      createdAt: new Date().toISOString()
    });

    showMessage("Account Created Successfully", "signUpMessage");
    setTimeout(() => {
      window.location.href = "index.html";
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

    const userDoc = await getDoc(doc(db, "users", user.uid));

    if (userDoc.exists()) {
      const userData = userDoc.data();
      const role = userData.role;

      if (role === "admin") {
        window.location.href = "admin-dashboard.html";
      } else {
        window.location.href = "user-dashboard.html";
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

// Google Sign-In
document.querySelectorAll(".fa-google").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        // Create user in Firestore if not exists
        await setDoc(doc(db, "users", user.uid), {
          email: user.email,
          firstName: user.displayName?.split(" ")[0] || "",
          lastName: user.displayName?.split(" ")[1] || "",
          role: "member"
        });

        // Also store minimal member profile
        await setDoc(doc(db, "members", user.uid), {
          email: user.email,
          firstName: user.displayName?.split(" ")[0] || "",
          lastName: user.displayName?.split(" ")[1] || "",
          createdAt: new Date().toISOString(),
          beneficiaries: []
        });
      }

      window.location.href = "user-dashboard.html";
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      alert("Google Sign-In failed: " + error.message);
    }
  });
});
