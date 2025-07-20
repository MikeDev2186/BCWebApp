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
        
        // Prepare member data with new fields
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
          employmentDetails: {
            employmentType: "",
            positionTitle: "",
            companyName: ""
          },
          presentAddress: {
            province: "",
            city: "",
            barangay: "",
            streetName: "",
            houseNumber: "",
            isPrimary: true
          },
          permanentAddress: {
            province: "",
            city: "",
            barangay: "",
            streetName: "",
            houseNumber: "",
            isPrimary: false
          },
          sectoralInfo: {
            pwd: false,
            soloParent: false,
            senior: false,
            student: false
          },
          healthRecord: {
            bloodType: "",
            height: 0,
            weight: 0,
            hairColor: "",
            eyeColor: "",
            wearingGlasses: false,
            wearingDentures: false
          },
          createdAt: new Date().toISOString(),
          role: "member"
        };

        // Save to Firebase
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

// Sign Up
document.getElementById("submitSignUp").addEventListener("click", async (event) => {
  event.preventDefault();

  const email = document.getElementById("rEmail").value.trim();
  const password = document.getElementById("rPassword").value;
  const firstName = document.getElementById("fName").value.trim();
  const lastName = document.getElementById("lName").value.trim();
  const middleName = document.getElementById("middleName").value.trim();
  const extension = document.getElementById("extension").value;
  const maidenName = document.getElementById("maidenName").value.trim();
  const dob = document.getElementById("dob").value;
  const placeOfBirthRegion = document.getElementById("placeOfBirthRegion").value;
  const placeOfBirthCity = document.getElementById("placeOfBirthCity").value;
  const nationality = document.getElementById("nationality").value.trim();
  const religion = document.getElementById("religion").value.trim();
  const sex = document.getElementById("sex").value;
  const civilStatus = document.getElementById("civilStatus").value.trim();
  const personalMobile = document.getElementById("personalMobile").value.trim();
  const alternateEmail = document.getElementById("alternateEmail").value.trim();
  const employed = document.getElementById("employed").value === "Yes";
  const employmentType = document.getElementById("employmentType").value;
  const positionTitle = document.getElementById("positionTitle").value.trim();
  const companyName = document.getElementById("companyName").value.trim();
  const presentAddress = {
    province: document.getElementById("presentProvince").value.trim(),
    city: document.getElementById("presentCity").value.trim(),
    barangay: document.getElementById("presentBarangay").value.trim(),
    streetName: document.getElementById("presentStreetName").value.trim(),
    houseNumber: document.getElementById("presentHouseNumber").value.trim(),
    isPrimary: document.getElementById("presentIsPrimary").checked
  };
  const permanentAddress = {
    province: document.getElementById("permanentProvince").value.trim(),
    city: document.getElementById("permanentCity").value.trim(),
    barangay: document.getElementById("permanentBarangay").value.trim(),
    streetName: document.getElementById("permanentStreetName").value.trim(),
    houseNumber: document.getElementById("permanentHouseNumber").value.trim(),
    isPrimary: document.getElementById("permanentIsPrimary").checked
  };
  const sectoralInfo = {
    pwd: document.getElementById("pwd").checked,
    soloParent: document.getElementById("soloParent").checked,
    senior: document.getElementById("senior").checked,
    student: document.getElementById("student").checked
  };
  const healthRecord = {
    bloodType: document.getElementById("bloodType").value.trim(),
    height: parseInt(document.getElementById("height").value, 10),
    weight: parseInt(document.getElementById("weight").value, 10),
    hairColor: document.getElementById("hairColor").value.trim(),
    eyeColor: document.getElementById("eyeColor").value.trim(),
    wearingGlasses: document.getElementById("wearingGlasses").checked,
    wearingDentures: document.getElementById("wearingDentures").checked
  };

  const memberData = {
    email,
    firstName,
    lastName,
    middleName,
    extension,
    maidenName,
    dob,
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
    createdAt: new Date().toISOString(),
    role: "member"
  };

  try {
    const signUpResult = await createUserWithEmailAndPassword(auth, email, password);
    const user = signUpResult.user;

    await setDoc(doc(db, "users", user.uid), memberData);
    await setDoc(doc(db, "members", user.uid), memberData);

    alert("Account created successfully!");
    window.location.href = "user-dashboard.html";
  } catch (error) {
    console.error("Sign-Up Error:", error);
    alert("Failed to create account: " + error.message);
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
