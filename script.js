// 1. Firebase Configuration (New Project: study-suppliers)
const firebaseConfig = {
    apiKey: "AIzaSyALrGK6yYtpORV5jHvANzpAi0WwPTPUqFI",
    authDomain: "study-suppliers.firebaseapp.com",
    projectId: "study-suppliers",
    storageBucket: "study-suppliers.firebasestorage.app",
    messagingSenderId: "1066506689674",
    appId: "1:1066506689674:web:4ac7e331b0068a4329e173",
    measurementId: "G-QBC1LFTM6S"
};

// Initialize Firebase (Compat Version)
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
let userSavedDownloads = JSON.parse(localStorage.getItem("studySuppliersDownloads")) || [];
let activityLogs = JSON.parse(localStorage.getItem("studySuppliersLogs")) || [];

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
    updateDownloadsBadge();
    renderActivityLogs();

    const clearBtn = document.getElementById("clearHistoryBtn");
    if (clearBtn) {
        clearBtn.onclick = function() {
            activityLogs = [];
            localStorage.setItem("studySuppliersLogs", JSON.stringify(activityLogs));
            renderActivityLogs();
        };
    }
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
    const forgotForm = document.getElementById("forgotForm");
    const adminForm = document.getElementById("adminLoginForm");

    if (regForm) regForm.classList.add("hidden");
    if (loginForm) loginForm.classList.add("hidden");
    if (forgotForm) forgotForm.classList.add("hidden");
    if (adminForm) adminForm.classList.add("hidden");

    if (mode === 'register') {
        if (regBtn) regBtn.classList.add("active");
        if (loginBtn) loginBtn.classList.remove("active");
        if (regForm) regForm.classList.remove("hidden");
    } else {
        if (loginBtn) loginBtn.classList.add("active");
        if (regBtn) regBtn.classList.remove("active");
        if (loginForm) loginForm.classList.remove("hidden");
    }
}

function toggleForgotView(e) {
    if (e) e.preventDefault();
    const loginForm = document.getElementById("loginForm");
    const forgotForm = document.getElementById("forgotForm");
    const authTabs = document.getElementById("mainAuthTabs");

    if (loginForm.classList.contains("hidden")) {
        loginForm.classList.remove("hidden");
        forgotForm.classList.add("hidden");
        authTabs.classList.remove("hidden");
    } else {
        loginForm.classList.add("hidden");
        forgotForm.classList.remove("hidden");
        authTabs.classList.add("hidden");
    }
}

function openAdminModal(e) {
    if (e) e.preventDefault();
    document.getElementById("loginForm").classList.add("hidden");
    document.getElementById("registerForm").classList.add("hidden");
    document.getElementById("forgotForm").classList.add("hidden");
    document.getElementById("mainAuthTabs").classList.add("hidden");
    document.getElementById("adminLoginForm").classList.remove("hidden");
}

function closeAdminModal(e) {
    if (e) e.preventDefault();
    document.getElementById("adminLoginForm").classList.add("hidden");
    switchAuthMode('login');
}

function updateUserStatusUI() {
    const greeting = document.getElementById("userGreeting");
    const adminNavBtn = document.getElementById("adminNavBtn");

    if (currentUser) {
        if (greeting) greeting.textContent = `Logged in: ${currentUser.name || 'User'} - [${(currentUser.role || 'student').toUpperCase()}]`;
        if (adminNavBtn) {
            if (currentUser.role === "admin") {
                adminNavBtn.classList.remove("hidden");
            } else {
                adminNavBtn.classList.add("hidden");
            }
        }
    }
}

// Form Submission Handlers with preventDefault
function setupAuthAndFormEvents() {
    const regForm = document.getElementById("registerForm");
    if (regForm) {
        regForm.onsubmit = async function (e) {
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
                regForm.reset();
                switchAuthMode('login'); 
            } catch (err) {
                alert("Registration Failed: " + err.message);
            }
        };
    }

    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.onsubmit = async function (e) {
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
    }

    const adminLoginForm = document.getElementById("adminLoginForm");
    if (adminLoginForm) {
        adminLoginForm.onsubmit = async function (e) {
            e.preventDefault();
            const email = document.getElementById("adminEmail").value.trim();
            const password = document.getElementById("adminPassword").value;
            const secretKey = document.getElementById("adminKeyInput").value;

            if (secretKey !== SECRET_ADMIN_KEY) {
                alert("Invalid Secret Admin Key!");
                return;
            }

            try {
                const res = await auth.signInWithEmailAndPassword(email, password);
                await db.collection("users").doc(res.user.uid).set({
                    name: "Admin",
                    email: email,
                    role: "admin"
                }, { merge: true });
                alert("Admin Login Successful!");
            } catch (err) {
                alert("Admin Login Failed: " + err.message);
            }
        };
    }

    const forgotForm = document.getElementById("forgotForm");
    if (forgotForm) {
        forgotForm.onsubmit = async function (e) {
            e.preventDefault();
            const email = document.getElementById("forgotEmail").value.trim();
            try {
                await auth.sendPasswordResetEmail(email);
                alert("Password reset link sent to your email!");
                forgotForm.reset();
                toggleForgotView(e);
            } catch (err) {
                alert("Error: " + err.message);
            }
        };
    }

    const userShareForm = document.getElementById("userShareForm");
    if (userShareForm) {
        userShareForm.onsubmit = function (e) {
            e.preventDefault();
            saveMaterialToDatabase("userMatYear", "userMatSem", "userMatSubject", "userMatCategory", "userMatTitle", "userMatUrl");
            userShareForm.reset();
        };
    }

    const addMaterialForm = document.getElementById("addMaterialForm");
    if (addMaterialForm) {
        addMaterialForm.onsubmit = function (e) {
            e.preventDefault();
            saveMaterialToDatabase("adminMatYear", "adminMatSem", "adminMatSubject", "adminMatCategory", "adminMatTitle", "adminMatUrl");
            addMaterialForm.reset();
        };
    }
}

// Navigation & Syllabus Logic
function showHome() {
    hideAllViews();
    document.getElementById("courseSelectionView").classList.remove("hidden");
}

function openYear(yearKey) {
    currentSelectedYear = yearKey;
    hideAllViews();
    document.getElementById("semesterSelectionView").classList.remove("hidden");
    
    const yearData = bcomCaSyllabus[yearKey];
    document.getElementById("selectedYearTitle").textContent = `${yearData.title} - Select Semester`;
    
    const semGrid = document.getElementById("semesterGrid");
    semGrid.innerHTML = "";

    for (const [semKey, semVal] of Object.entries(yearData.semesters)) {
        const card = document.createElement("div");
        card.className = "course-card";
        card.onclick = function() { openSemester(semKey); };
        card.innerHTML = `
            <i class="fa-solid fa-bookmark course-icon"></i>
            <h3>${semVal.title}</h3>
            <p>Access subjects and notes</p>
            <button type="button" class="explore-btn">Open Semester <i class="fa-solid fa-arrow-right"></i></button>
        `;
        semGrid.appendChild(card);
    }
}

function openSemester(semKey) {
    currentSelectedSem = semKey;
    hideAllViews();
    document.getElementById("subjectSelectionView").classList.remove("hidden");

    const semData = bcomCaSyllabus[currentSelectedYear].semesters[semKey];
    document.getElementById("selectedSemTitle").textContent = `${semData.title} - Select Subject`;

    const subGrid = document.getElementById("subjectGrid");
    subGrid.innerHTML = "";

    semData.subjects.forEach(subj => {
        const card = document.createElement("div");
        card.className = "subject-card";
        card.onclick = function() { openSubject(subj.name); };
        card.innerHTML = `
            <i class="fa-solid fa-book-bookmark" style="font-size:2rem; color:#0284c7; margin-bottom:10px;"></i>
            <h3>${subj.name}</h3>
            <p>${subj.isPractical ? 'Practical / Lab Subject' : 'Theory Subject'}</p>
        `;
        subGrid.appendChild(card);
    });
}

function openSubject(subjectName) {
    currentSelectedSubject = subjectName;
    hideAllViews();
    document.getElementById("materialsDetailView").classList.remove("hidden");
    document.getElementById("selectedSubjectTitle").textContent = subjectName;
    renderSubjectMaterials(currentSelectedYear, currentSelectedSem, subjectName);
}

function backToSemesters() {
    openYear(currentSelectedYear);
}

function backToSubjects() {
    openSemester(currentSelectedSem);
}

function populateFormSemesters(yearSelectId, semSelectId, subjSelectId) {
    const yearKey = document.getElementById(yearSelectId).value;
    const semSelect = document.getElementById(semSelectId);
    semSelect.innerHTML = '<option value="">2. Select Semester</option>';
    document.getElementById(subjSelectId).innerHTML = '<option value="">3. Select Subject</option>';

    if (!yearKey) return;
    const sems = bcomCaSyllabus[yearKey].semesters;
    for (const [key, val] of Object.entries(sems)) {
        semSelect.innerHTML += `<option value="${key}">${val.title}</option>`;
    }
}

function populateFormSubjects(yearSelectId, semSelectId, subjSelectId) {
    const yearKey = document.getElementById(yearSelectId).value;
    const semKey = document.getElementById(semSelectId).value;
    const subjSelect = document.getElementById(subjSelectId);
    subjSelect.innerHTML = '<option value="">3. Select Subject</option>';

    if (!yearKey || !semKey) return;
    const subs = bcomCaSyllabus[yearKey].semesters[semKey].subjects;
    subs.forEach(s => {
        subjSelect.innerHTML += `<option value="${s.name}">${s.name}</option>`;
    });
}

function populateCategories(yearSelectId, semSelectId, subjSelectId, catSelectId) {
    const catSelect = document.getElementById(catSelectId);
    catSelect.innerHTML = `
        <option value="">4. Select Category</option>
        <option value="Notes">Notes / Unit Material</option>
        <option value="Question Papers">Question Papers</option>
        <option value="Practical Slips">Practical Slips / Code</option>
        <option value="Reference Books">Reference Books</option>
    `;
}

// Global PDF Save Function (Firebase Firestore - Visible to All)
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

        alert("PDF Material Added Successfully! It is now live and visible to ALL website visitors.");
        if (currentSelectedSubject === subject) {
            renderSubjectMaterials(year, sem, subject);
        }
    } catch (err) {
        alert("Upload Failed: " + err.message);
    }
}

// Live PDF Materials Fetch Function (Global)
async function renderSubjectMaterials(yearKey, semKey, subjectName) {
    const grid = document.getElementById("materialsGrid");
    grid.innerHTML = "<p style='text-align:center;'>Loading live materials from database...</p>";

    try {
        const snapshot = await db.collection("materials")
            .where("year", "==", yearKey)
            .where("sem", "==", semKey)
            .where("subject", "==", subjectName)
            .get();

        grid.innerHTML = "";
        if (snapshot.empty) {
            grid.innerHTML = `<div style="text-align:center; padding:30px;"><b>No PDFs uploaded for ${subjectName} yet. Be the first to upload!</b></div>`;
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
                        <a href="${previewUrl}" target="_blank" class="action-btn btn-open" onclick="logActivity('Viewed PDF: ${item.title}')">View</a>
                        <a href="${downloadUrl}" target="_blank" class="action-btn btn-download" onclick="logActivity('Downloaded PDF: ${item.title}')">Download</a>
                        <button type="button" class="action-btn" style="background:#0284c7; color:#fff; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;" onclick='saveToMyDownloads(${JSON.stringify(item)})'>Save</button>
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

function saveToMyDownloads(item) {
    if (!userSavedDownloads.some(d => d.title === item.title && d.url === item.url)) {
        userSavedDownloads.push(item);
        localStorage.setItem("studySuppliersDownloads", JSON.stringify(userSavedDownloads));
        updateDownloadsBadge();
        alert("PDF saved to 'My Saved PDFs' successfully!");
        logActivity(`Saved PDF to local list: ${item.title}`);
    } else {
        alert("This PDF is already in your saved list.");
    }
}

function openUserDownloads() {
    hideAllViews();
    document.getElementById("userDownloadsView").classList.remove("hidden");
    const grid = document.getElementById("userDownloadsGrid");
    grid.innerHTML = "";

    if (userSavedDownloads.length === 0) {
        grid.innerHTML = "<p style='text-align:center; padding:30px;'>No saved PDFs found.</p>";
        return;
    }

    userSavedDownloads.forEach((item, index) => {
        const { previewUrl, downloadUrl } = processPdfUrls(item.url);
        const card = document.createElement("div");
        card.className = "pdf-item-card";
        card.innerHTML = `
            <div class="pdf-item-header">
                <div><i class="fa-solid fa-file-pdf" style="color:#e11d48;"></i> <b>${item.title}</b> (${item.category || 'General'})</div>
                <div class="pdf-action-btns">
                    <a href="${previewUrl}" target="_blank" class="action-btn btn-open">View</a>
                    <a href="${downloadUrl}" target="_blank" class="action-btn btn-
