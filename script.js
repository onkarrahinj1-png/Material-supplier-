// 1. Firebase Configuration (अपने Firebase Console से यह Keys बदलें)
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore();

const SECRET_ADMIN_KEY = "admin2020";

// BCom CA Syllabus Data Structure
const bcomCaSyllabus = {
    fy: {
        title: "FY BCom CA",
        semesters: {
            sem1: { title: "Semester 1", subjects: [{ name: "C Programming", isPractical: true }, { name: "OAT", isPractical: true }, { name: "Financial Accounting", isPractical: false }, { name: "Business Communication", isPractical: false }] },
            sem2: { title: "Semester 2", subjects: [{ name: "TPA", isPractical: true }, { name: "DBMS", isPractical: true }, { name: "Financial Accounting II", isPractical: false }] }
        }
    },
    sy: {
        title: "SY BCom CA",
        semesters: {
            sem3: { title: "Semester 3", subjects: [{ name: "Data Structure (DS)", isPractical: true }, { name: "PHP Programming", isPractical: true }, { name: "Cyber Security", isPractical: false }] },
            sem4: { title: "Semester 4", subjects: [{ name: "SY Project", isPractical: true }, { name: "Advanced Web Tech", isPractical: true }] }
        }
    },
    ty: {
        title: "TY BCom CA",
        semesters: {
            sem5: { title: "Semester 5", subjects: [{ name: "Java Programming", isPractical: true }, { name: "Python Programming", isPractical: true }] },
            sem6: { title: "Semester 6", subjects: [{ name: "Cloud Computing", isPractical: true }, { name: "Main Project", isPractical: true }] }
        }
    }
};

let currentUser = null;
let currentSelectedYear = "";
let currentSelectedSem = "";
let currentSelectedSubject = "";

document.addEventListener("DOMContentLoaded", function () {
    // Check Active Auth User Session
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            const userDoc = await db.collection("users").doc(user.uid).get();
            if (userDoc.exists) {
                currentUser = userDoc.data();
                currentUser.uid = user.uid;
            } else {
                currentUser = { name: "Admin", email: user.email, role: "admin" };
            }
            showPortalUI();
        } else {
            currentUser = null;
            showAuthUI();
        }
    });

    setupAuthAndFormEvents();
});

function showPortalUI() {
    document.getElementById("landingAuthOverlay").classList.add("hidden");
    document.getElementById("portalMainContent").classList.remove("hidden");
    updateUserStatusUI();
    showHome();
}

function showAuthUI() {
    document.getElementById("portalMainContent").classList.add("hidden");
    document.getElementById("landingAuthOverlay").classList.remove("hidden");
    switchAuthMode('login');
}

function switchAuthMode(mode) {
    document.getElementById("mainAuthTabs").classList.remove("hidden");
    const regBtn = document.getElementById("tabRegisterBtn");
    const loginBtn = document.getElementById("tabLoginBtn");
    const regForm = document.getElementById("registerForm");
    const loginForm = document.getElementById("loginForm");

    if (mode === 'register') {
        regBtn.classList.add("active");
        loginBtn.classList.remove("active");
        regForm.classList.remove("hidden");
        loginForm.classList.add("hidden");
    } else {
        loginBtn.classList.add("active");
        regBtn.classList.remove("active");
        loginForm.classList.remove("hidden");
        regForm.classList.add("hidden");
    }
}

function updateUserStatusUI() {
    const greeting = document.getElementById("userGreeting");
    const adminNavBtn = document.getElementById("adminNavBtn");

    if (currentUser) {
        greeting.textContent = `Logged in: ${currentUser.name || 'User'} - [${(currentUser.role || 'student').toUpperCase()}]`;
        if (currentUser.role === "admin") {
            adminNavBtn.classList.remove("hidden");
        } else {
            adminNavBtn.classList.add("hidden");
        }
    }
}

function setupAuthAndFormEvents() {
    // 1. Live Registration with Firebase
    document.getElementById("registerForm").onsubmit = async function (e) {
        e.preventDefault();
        const name = document.getElementById("regName").value.trim();
        const email = document.getElementById("regEmail").value.trim();
        const password = document.getElementById("regPassword").value;

        try {
            const res = await auth.createUserWithEmailAndPassword(email, password);
            await db.collection("users").doc(res.user.uid).set({
                name: name,
                email: email,
                role: "student",
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            alert("Registration Successful! Please login.");
            document.getElementById("registerForm").reset();
            switchAuthMode('login'); // Smooth transition to login
        } catch (err) {
            alert("Registration Failed: " + err.message);
        }
    };

    // 2. Live Login with Firebase
    document.getElementById("loginForm").onsubmit = async function (e) {
        e.preventDefault();
        const email = document.getElementById("loginEmail").value.trim();
        const password = document.getElementById("loginPassword").value;

        try {
            await auth.signInWithEmailAndPassword(email, password);
            alert("Login Successful!");
        } catch (err) {
            alert("Login Failed: " + err.message);
        }
    };

    // 3. User & Admin PDF Upload Event (Live for all visitors)
    document.getElementById("userShareForm").onsubmit = function (e) {
        e.preventDefault();
        saveMaterialToDatabase("userMatYear", "userMatSem", "userMatSubject", "userMatCategory", "userMatTitle", "userMatUrl");
        document.getElementById("userShareForm").reset();
    };

    document.getElementById("addMaterialForm").onsubmit = function (e) {
        e.preventDefault();
        saveMaterialToDatabase("adminMatYear", "adminMatSem", "adminMatSubject", "adminMatCategory", "adminMatTitle", "adminMatUrl");
        document.getElementById("addMaterialForm").reset();
    };
}

// 4. Global PDF Save Function (Firebase Firestore)
async function saveMaterialToDatabase(yId, sId, subjId, catId, titleId, urlId) {
    const year = document.getElementById(yId).value;
    const sem = document.getElementById(sId).value;
    const subject = document.getElementById(subjId).value;
    const category = document.getElementById(catId).value;
    const title = document.getElementById(titleId).value.trim();
    const url = document.getElementById(urlId).value.trim();

    try {
        await db.collection("materials").add({
            year, sem, subject, category, title, url,
            uploadedAt: firebase.firestore.FieldValue.serverTimestamp(),
            uploadedBy: currentUser ? currentUser.email : "Guest"
        });

        alert("PDF Material Added! It is now visible to ALL website visitors.");
        if (currentSelectedSubject === subject) {
            renderSubjectMaterials(year, sem, subject);
        }
    } catch (err) {
        alert("Upload Failed: " + err.message);
    }
}

// 5. Live PDF Materials Fetch Function
async function renderSubjectMaterials(yearKey, semKey, subjectName) {
    const grid = document.getElementById("materialsGrid");
    grid.innerHTML = "<p style='text-align:center;'>Loading live materials...</p>";

    try {
        const snapshot = await db.collection("materials")
            .where("year", "==", yearKey)
            .where("sem", "==", semKey)
            .where("subject", "==", subjectName)
            .get();

        grid.innerHTML = "";
        if (snapshot.empty) {
            grid.innerHTML = `<div style="text-align:center; padding:30px;"><b>No PDFs uploaded for ${subjectName} yet.</b></div>`;
            return;
        }

        snapshot.forEach(doc => {
            const item = doc.data();
            const { previewUrl, downloadUrl } = processPdfUrls(item.url);
            const card = document.createElement("div");
            card.className = "pdf-item-card";
            card.innerHTML = `
                <div class="pdf-item-header">
                    <div><i class="fa-solid fa-file-pdf" style="color:#e11d48;"></i> <b>${item.title}</b> (${item.category})</div>
                    <div class="pdf-action-btns">
                        <a href="${previewUrl}" target="_blank" class="action-btn btn-open">View</a>
                        <a href="${downloadUrl}" target="_blank" class="action-btn btn-download">Download</a>
                    </div>
                </div>
                <iframe src="${previewUrl}" width="100%" height="300" style="margin-top:10px; border-radius:6px; border:1px solid #cbd5e1;"></iframe>
            `;
            grid.appendChild(card);
        });
    } catch (err) {
        grid.innerHTML = "<p>Error loading materials: " + err.message + "</p>";
    }
}

function processPdfUrls(rawUrl) {
    let previewUrl = rawUrl;
    let downloadUrl = rawUrl;
    if (rawUrl.includes("drive.google.com")) {
        const match = rawUrl.match(/\/d\/([a-zA-Z0-9_-]+)/) || rawUrl.match(/id=([a-zA-Z0-9_-]+)/);
        if (match && match[1]) {
            previewUrl = `https://drive.google.com/file/d/${match[1]}/preview`;
            downloadUrl = `https://drive.google.com/uc?export=download&id=${match[1]}`;
        }
    }
    return { previewUrl, downloadUrl };
}

function logoutUser() {
    auth.signOut().then(() => {
        showAuthUI();
    });
}

function showHome() {
    hideAllViews();
    document.getElementById("courseSelectionView").classList.remove("hidden");
}

function hideAllViews() {
    const views = document.querySelectorAll(".view-section");
    views.forEach(v => v.classList.add("hidden"));
    }
