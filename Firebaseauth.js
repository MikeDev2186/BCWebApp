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
const storage = getStorage(app);

// Debug function to log database operations
function debugLog(operation, data) {
  console.log(`[DEBUG] ${operation}:`, data);
}

// Show messages
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

// Collect beneficiaries
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

// Upload file to Firebase Storage
async function uploadDocument(userId, file) {
  try {
    debugLog("Starting file upload", { userId, fileName: file.name });
    const fileRef = ref(storage, `documents/${userId}/${file.name}`);
    const snapshot = await uploadBytes(fileRef, file);
    debugLog("File uploaded successfully", snapshot);
    const downloadURL = await getDownloadURL(fileRef);
    debugLog("Download URL obtained", downloadURL);
    return downloadURL;
  } catch (error) {
    debugLog("File upload error", error);
    throw error;
  }
}

// Sign Up
document.getElementById("submitSignUp").addEventListener("click", async (event) => {
  event.preventDefault();

  const email = document.getElementById("rEmail").value.trim();
  const password = document.getElementById("rPassword").value;
  const firstName = document.getElementById("fName").value.trim();
  const lastName = document.getElementById("lName").value.trim();
  const barangay = document.getElementById("barangay").value;
  const file = document.getElementById("validDocument").files[0];

  debugLog("Sign up attempt", { email, firstName, lastName, barangay, hasFile: !!file });

  if (barangay !== "Commonwealth") {
    showMessage("Registration restricted to Barangay Commonwealth only", "signUpMessage");
    return;
  }

  if (!file) {
    showMessage("You must upload a valid ID or birth certificate.", "signUpMessage");
    return;
  }

  try {
    // Step 1: Create user account
    debugLog("Creating user account", { email });
    const signUpResult = await createUserWithEmailAndPassword(auth, email, password);
    const user = signUpResult.user;
    debugLog("User account created", { uid: user.uid, email: user.email });

    // Step 2: Upload document
    const documentURL = await uploadDocument(user.uid, file);


    // Step 3: Prepare full member data
    const phone = document.getElementById("phone")?.value || "";
    const address = document.getElementById("address")?.value || "";
    const dob = document.getElementById("dob")?.value || "";
    const maritalStatus = document.getElementById("maritalStatus")?.value || "";
    const beneficiaries = getBeneficiaries();
    const role = "member";
    const memberData = {
      email,
      firstName,
      lastName,
      phone,
      address,
      dob,
      maritalStatus,
      barangay,
      documentURL,
      beneficiaries,
      createdAt: new Date().toISOString(),
      role
    };
    debugLog("Preparing to save member data", memberData);

    // Step 4: Save to both "users" and "members" collections
    try {
      await setDoc(doc(db, "users", user.uid), memberData);
      debugLog("Successfully saved to users collection", { uid: user.uid });
    } catch (dbError) {
      debugLog("Error saving to users collection", dbError);
      throw new Error(`Failed to save user data: ${dbError.message}`);
    }
    try {
      await setDoc(doc(db, "members", user.uid), memberData);
      debugLog("Successfully saved to members collection", { uid: user.uid });
    } catch (dbError) {
      debugLog("Error saving to members collection", dbError);
      throw new Error(`Failed to save member data: ${dbError.message}`);
    }

    showMessage("Account Created Successfully", "signUpMessage");
    debugLog("Registration completed successfully", { uid: user.uid });
    
    setTimeout(() => {
      window.location.href = "index.html";
    }, 1000);

  } catch (error) {
    debugLog("Sign up error", error);
    
    if (error.code === "auth/email-already-in-use") {
      showMessage("Email already exists!", "signUpMessage");
    } else if (error.code === "auth/weak-password") {
      showMessage("Password should be at least 6 characters", "signUpMessage");
    } else if (error.code === "auth/invalid-email") {
      showMessage("Invalid email address", "signUpMessage");
    } else if (error.message.includes("Failed to save")) {
      showMessage(error.message, "signUpMessage");
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

  debugLog("Sign in attempt", { email });

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    debugLog("User signed in", { uid: user.uid, email: user.email });

    const userDoc = await getDoc(doc(db, "users", user.uid));
    debugLog("User document fetch result", { exists: userDoc.exists() });

    let role = "member";
    if (userDoc.exists()) {
      const userData = userDoc.data();
      role = userData.role || "member";
      debugLog("User role", { role });
    } else {
      debugLog("User document not found in database, defaulting to member dashboard", { uid: user.uid });
    }

    if (role === "admin") {
      window.location.href = "admin-dashboard.html";
    } else {
      window.location.href = "user-dashboard.html";
    }

    showMessage("Login Successful", "signInMessage");
  } catch (error) {
    debugLog("Sign in error", error);
    console.error("Sign in error:", error);
    if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
      showMessage("Invalid email or password", "signInMessage");
    } else if (error.code === "auth/invalid-email") {
      showMessage("Invalid email address", "signInMessage");
    } else {
      showMessage("Error: " + error.message, "signInMessage");
    }
  }
});

// Google Sign-In
document.querySelectorAll(".fa-google").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const provider = new GoogleAuthProvider();
    debugLog("Google sign-in attempt");

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      debugLog("Google sign-in successful", { uid: user.uid, email: user.email });

      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        debugLog("New Google user, creating database records");
        const firstName = user.displayName?.split(" ")[0] || "";
        const lastName = user.displayName?.split(" ")[1] || "";
        const memberData = {
          email: user.email,
          firstName,
          lastName,
          phone: "",
          address: "",
          dob: "",
          maritalStatus: "",
          barangay: "Commonwealth",
          documentURL: "",
          beneficiaries: [],
          createdAt: new Date().toISOString(),
          role: "member"
        };
        await setDoc(doc(db, "users", user.uid), memberData);
        await setDoc(doc(db, "members", user.uid), memberData);
        debugLog("Google user data saved successfully");
      }
      window.location.href = "user-dashboard.html";
    } catch (error) {
      debugLog("Google Sign-In Error", error);
      console.error("Google Sign-In Error:", error);
      alert("Google Sign-In failed: " + error.message);
    }
  });
});

// Add a function to test database connectivity
window.testDatabaseConnection = async () => {
  try {
    debugLog("Testing database connection");
    const testDocRef = doc(db, "test", "connection");
    await setDoc(testDocRef, { 
      timestamp: new Date().toISOString(),
      test: "Database connection successful"
    });
    debugLog("Database connection test successful");
    alert("Database connection is working!");
  } catch (error) {
    debugLog("Database connection test failed", error);
    alert("Database connection failed: " + error.message);
  }
};

// Log Firebase initialization
debugLog("Firebase initialized", { 
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain 
});
