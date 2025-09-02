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

// Debug function
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
      // hide after fade
      setTimeout(() => { messageDiv.style.display = "none"; }, 400);
    }, 4000);
  } else {
    alert(message);
  }
}

// small helper to wait
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helpers
function getValue(id, defaultValue = "") {
  const el = document.getElementById(id);
  if (!el) return defaultValue;
  if (el.type === "checkbox") return el.checked;
  return (el.value ?? defaultValue).toString().trim();
}
function getChecked(id) {
  const el = document.getElementById(id);
  return el ? !!el.checked : false;
}
function getIntValue(id, defaultValue = 0) {
  const val = document.getElementById(id)?.value;
  const n = parseInt(val, 10);
  return Number.isFinite(n) ? n : defaultValue;
}
function calculateAge(dobValue) {
  if (!dobValue) return null;
  const dob = new Date(dobValue);
  if (isNaN(dob)) return null;
  const diff = Date.now() - dob.getTime();
  const ageDt = new Date(diff);
  return Math.abs(ageDt.getUTCFullYear() - 1970);
}

// Collect beneficiaries (keeps original behavior)
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

// Upload file
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

// Google Sign-In (keeps previous behavior)
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
        const nameParts = (user.displayName || "").split(" ");
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";
        const memberData = {
          email: user.email,
          firstName,
          lastName,
          middleName: "",
          extension: "",
          maidenName: "",
          dob: "",
          placeOfBirth: { region: "", city: "" },
          nationality: "",
          religion: "",
          sex: "",
          civilStatus: "",
          personalMobile: "",
          alternateEmail: "",
          employed: false,
          employmentDetails: { employmentType: "", positionTitle: "", companyName: "" },
          presentAddress: { province: "", city: "", barangay: "", streetName: "", houseNumber: "", isPrimary: true },
          permanentAddress: { province: "", city: "", barangay: "", streetName: "", houseNumber: "", isPrimary: false },
          sectoralInfo: { pwd: false, soloParent: false, senior: false, student: false },
          healthRecord: { bloodType: "", height: 0, weight: 0, hairColor: "", eyeColor: "", wearingGlasses: false, wearingDentures: false },
          createdAt: new Date().toISOString(),
          role: "member"
        };
        await setDoc(doc(db, "users", user.uid), memberData);
        await setDoc(doc(db, "members", user.uid), memberData);
        debugLog("Google user data saved successfully");
      }

      // Show success message and redirect
      showMessage("Registration successful! Redirecting...", "signInMessage");
      await delay(1400);
      window.location.href = "user-dashboard.html";
    } catch (error) {
      debugLog("Google Sign-In Error", error);
      console.error("Google Sign-In Error:", error);
      alert("Google Sign-In failed: " + (error.message || error));
    }
  });
});

// Sign Up
document.getElementById("submitSignUp")?.addEventListener("click", async (event) => {
  event.preventDefault();

  try {
    const email = getValue("rEmail");
    const password = document.getElementById("rPassword")?.value ?? "";
    const username = getValue("username");
    // Personal fields
    const firstName = getValue("fName");
    const dontHaveMiddle = getChecked("dontHaveMiddleName");
    const middleName = dontHaveMiddle ? "" : getValue("middleName");
    const lastName = getValue("lName");
    let extension = getValue("extension");
    if (extension === "Other") {
      const other = getValue("extensionOther");
      extension = other || "Other";
    }
    const maidenName = getValue("maidenName");
    const dob = getValue("dob");
    const age = calculateAge(dob);
    const isAdult = age !== null ? age >= 18 : null;
    const placeOfBirthRegion = getValue("placeOfBirthRegion");
    const placeOfBirthCity = getValue("placeOfBirthCity");
    const nationality = getValue("nationality");
    const religion = getValue("religion");
    const sex = getValue("sex");
    const civilStatus = getValue("civilStatus");
    const personalMobile = getValue("personalMobile");
    const alternateEmail = getValue("alternateEmail");

    // Work info
    let employed = getValue("employed") === "Yes" || getValue("employed") === true;
    // If age known and < 18, force employed = false
    if (isAdult === false) {
      employed = false;
    }
    const employmentType = employed ? getValue("employmentType") : "";
    const positionTitle = employed ? getValue("positionTitle") : "";
    const companyName = employed ? getValue("companyName") : "";

    const presentAddress = {
      province: getValue("presentProvince"),
      city: getValue("presentCity"),
      barangay: getValue("presentBarangay"),
      streetName: getValue("presentStreetName"),
      houseNumber: getValue("presentHouseNumber"),
      isPrimary: getChecked("presentIsPrimary")
    };
    const permanentAddress = {
      province: getValue("permanentProvince"),
      city: getValue("permanentCity"),
      barangay: getValue("permanentBarangay"),
      streetName: getValue("permanentStreetName"),
      houseNumber: getValue("permanentHouseNumber"),
      isPrimary: getValue("permanentIsPrimary") === "Yes" || getChecked("permanentIsPrimary")
    };

    const sectoralInfo = {
      pwd: getChecked("pwd"),
      soloParent: getChecked("soloParent"),
      senior: getChecked("senior"),
      student: getChecked("student")
    };

    const healthRecord = {
      bloodType: getValue("bloodType"),
      height: getIntValue("height", 0),
      weight: getIntValue("weight", 0),
      hairColor: getValue("hairColor"),
      eyeColor: getValue("eyeColor"),
      wearingGlasses: getChecked("wearingGlasses"),
      wearingDentures: getChecked("wearingDentures")
    };

    const memberData = {
      email,
      username,
      firstName,
      lastName,
      middleName,
      extension,
      maidenName,
      dob,
      age,
      placeOfBirth: { region: placeOfBirthRegion, city: placeOfBirthCity },
      nationality,
      religion,
      sex,
      civilStatus,
      personalMobile,
      alternateEmail,
      employed,
      employmentDetails: { employmentType, positionTitle, companyName },
      presentAddress,
      permanentAddress,
      sectoralInfo,
      healthRecord,
      beneficiaries: getBeneficiaries(),
      createdAt: new Date().toISOString(),
      role: "member"
    };

    // file upload & account creation
    const fileInput = document.getElementById("validDocument");
    // Create user first to get UID (and ensure auth account created) - we do this before upload to organize storage path
    const signUpResult = await createUserWithEmailAndPassword(auth, email, password);
    const user = signUpResult.user;

    if (fileInput && fileInput.files && fileInput.files.length > 0) {
      try {
        const downloadURL = await uploadDocument(user.uid, fileInput.files[0]);
        memberData.validDocumentURL = downloadURL;
      } catch (uploadErr) {
        debugLog("Document upload failed (continuing)", uploadErr);
      }
    }

    await setDoc(doc(db, "users", user.uid), memberData);
    await setDoc(doc(db, "members", user.uid), memberData);

    // show success message and redirect so the user can see it
    if (typeof window.showRegistrationSuccess === 'function') {
      window.showRegistrationSuccess("Registration successful! Redirecting to your dashboard...");
    } else {
      showMessage("Registration successful! Redirecting...", "signUpMessage");
    }
    await delay(2000);
    window.location.href = "user-dashboard.html";
  } catch (error) {
    console.error("Sign-Up Error:", error);
    if (error?.code) {
      showMessage("Failed to create account: " + (error.message || error.code), "signUpMessage");
    } else {
      showMessage("Failed to create account: " + (error?.message || error), "signUpMessage");
    }
  }
});

// Sign In (no functional change)
document.getElementById("submitSignIn")?.addEventListener("click", async (event) => {
  event.preventDefault();
  const email = document.getElementById("email")?.value?.trim() || "";
  const password = document.getElementById("password")?.value || "";
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
    }

    showMessage("Login Successful", "signInMessage");
    await delay(900);
    if (role === "admin") {
      window.location.href = "admin-dashboard.html";
    } else {
      window.location.href = "user-dashboard.html";
    }
  } catch (error) {
    debugLog("Sign in error", error);
    console.error("Sign in error:", error);
    if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
      showMessage("Invalid email or password", "signInMessage");
    } else if (error.code === "auth/invalid-email") {
      showMessage("Invalid email address", "signInMessage");
    } else {
      showMessage("Error: " + (error.message || error), "signInMessage");
    }
  }
});

// Test DB connectivity helper
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

debugLog("Firebase initialized", {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain
});
