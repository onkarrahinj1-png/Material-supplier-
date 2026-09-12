// EmailJS Credentials Declarations
const EMAILJS_PUBLIC_KEY = "YOUR_PUBLIC_KEY";   
const EMAILJS_SERVICE_ID = "YOUR_SERVICE_ID";   
const EMAILJS_TEMPLATE_ID = "YOUR_TEMPLATE_ID"; 

const SECRET_ADMIN_KEY = "admin2020";

// Firebase configuration (Firestore Database & Auth Setup)
// Note: Ensure you include Firebase SDK scripts in your html or use modular imports if required. 
// Here we integrate standard Firestore logic seamlessly with your frontend view switches.

// BCom CA Syllabus Data Structure
const bcomCaSyllabus = {
    fy: {
        title: "FY BCom CA",
        semesters: {
            sem1: {
                title: "Semester 1",
                subjects: [
                    { name: "C Programming", isPractical: true },
                    { name: "OAT (Office Automation Tools)", isPractical: true },
                    { name: "Financial Accounting", isPractical: false },
                    { name: "Business Communication", isPractical: false },
                    { name: "Principles of Management", isPractical: false }
                ]
            },
            sem2: {
                title: "Semester 2",
                subjects: [
                    { name: "TPA", isPractical: true },
                    { name: "DBMS", isPractical: true },
                    { name: "Financial Accounting II", isPractical: false },
                    { name: "Business Economics", isPractical: false },
                    { name: "Principles of Marketing", isPractical: false }
                ]
            }
        }
    },
    sy: {
        title: "SY BCom CA",
        semesters: {
            sem3: {
                title: "Semester 3",
                subjects: [
                    { name: "Data Structure (DS)", isPractical: true },
                    { name: "PHP Programming", isPractical: true },
                    { name: "Cyber Security", isPractical: false },
                    { name: "Web Development", isPractical: true },
                    { name: "Cost Accounting", isPractical: false }
                ]
            },
            sem4: {
                title: "Semester 4",
                subjects: [
                    { name: "SY Project", isPractical: true },
                    { name: "Advanced Web Tech", isPractical: true },
                    { name: "Corporate Accounting", isPractical: false },
                    { name: "Computer Networks", isPractical: false },
                    { name: "MIS", isPractical: false }
                ]
            }
        }
    },
    ty: {
        title: "TY BCom CA",
        semesters: {
            sem5: {
                title: "Semester 5",
                subjects: [
                    { name: "Java Programming", isPractical: true },
                    { name: "Python Programming", isPractical: true },
                    { name: "SE (Software Engineering)", isPractical: true },
                    { name: "Cyber Law", isPractical: false },
                    { name: "E-Commerce", isPractical: false }
                ]
            },
            sem6: {
                title: "Semester 6",
                subjects: [
                    { name: "Cloud Computing", isPractical: true },
                    { name: "Main Project", isPractical: true },
                    { name: "Software Testing", isPractical: false },
                    { name: "Digital Marketing", isPractical: false },
                    { name: "Entrepreneurship", isPractical: false }
                ]
            }
        }
    }
};

// LocalStorage & Sync Helpers
function getLocalData(key) {
    return JSON.parse(localStorage.getItem(key) || "[]");
}

function setLocalData(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
}

let currentUser = JSON.parse(localStorage.getItem("active_user") || "null");
let currentSelectedYear = "";
let currentSelectedSem = "";
let currentSelectedSubject = "";

document.addEventListener("DOMContentLoaded", function () {
    checkInitialAuthFlow();
    setupAuthAndFormEvents();
    renderHistoryList();
    updateDownloadBadgeCount();
});

// Authentication Flow Management
function checkInitialAuthFlow() {
    const landingOverlay = document.getElementById("landingAuthOverlay");
    const portalContent = document.getElementById("portalMainContent");

    if (currentUser) {
        if (landingOverlay) landingOverlay.classList.add("hidden");
        if (portalContent) portalContent.classList.remove("hidden");
        
        // Show Admin Panel Button if user is Admin
        const adminBtn = document.getElementById("adminNavBtn");
        if (adminBtn) {
            if (currentUser.isAdmin) {
                adminBtn.classList.remove("hidden");
            } else {
                adminBtn.classList.add("hidden");
            }
        }
        
        const greeting = document.getElementById("userGreeting");
        if (greeting) {
            greeting.innerText = `Logged in as: ${currentUser.name || currentUser.email} (${currentUser.isAdmin ? 'Admin' : 'Student'})`;
        }
    } else {
        if (landingOverlay) landingOverlay.classList.remove("hidden");
        if (portalContent) portalContent.classList.add("hidden");
    }
}

function setupAuthAndFormEvents() {
    // Registration Form Handler
    const regForm = document.getElementById("registerForm");
    if (regForm) {
        regForm.addEventListener("submit", function(e) {
            e.preventDefault();
            const name = document.getElementById("regName").value;
            const username = document.getElementById("regUsername").value;
            const userId = document.getElementById("regUserId").value;
            const email = document.getElementById("regEmail").value;
            const password = document.getElementById("regPassword").value;

            let users = getLocalData("study_suppliers_users");
            users.push({ name, username, userId, email, password, isAdmin: false });
            setLocalData("study_suppliers_users", users);

            alert("Registration successful! Please login now.");
            switchAuthMode('login');
            regForm.reset();
        });
    }

    // Login Form Handler
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", function(e) {
            e.preventDefault();
            const email = document.getElementById("loginEmail").value;
            const password = document.getElementById("loginPassword").value;

            let users = getLocalData("study_suppliers_users");
            const foundUser = users.find(u => u.email === email && u.password === password);

            if (foundUser) {
                currentUser = foundUser;
                localStorage.setItem("active_user", JSON.stringify(currentUser));
                checkInitialAuthFlow();
                showHome();
            } else {
                alert("Invalid email or password!");
            }
        });
    }

    // Admin Login Form Handler
    const adminLoginForm = document.getElementById("adminLoginForm");
    if (adminLoginForm) {
        adminLoginForm.addEventListener("submit", function(e) {
            e.preventDefault();
            const email = document.getElementById("adminEmail").value;
            const password = document.getElementById("adminPassword").value;
            const key = document.getElementById("adminKeyInput").value;

            if (key === SECRET_ADMIN_KEY) {
                currentUser = { name: "Administrator", email: email, isAdmin: true };
                localStorage.setItem("active_user", JSON.stringify(currentUser));
                checkInitialAuthFlow();
                showHome();
            } else {
                alert("Incorrect Secret Admin Key!");
            }
        });
    }

    // Admin Material Upload Handler (Firestore + Local Sync)
    const addMaterialForm = document.getElementById("addMaterialForm");
    if (addMaterialForm) {
        addMaterialForm.addEventListener("submit", function(e) {
            e.preventDefault();
            handleMaterialSubmission('adminMatYear', 'adminMatSem', 'adminMatSubject', 'adminMatCategory', 'adminMatTitle', 'adminMatUrl', true);
            addMaterialForm.reset();
        });
    }

    // User Share Form Handler
    const userShareForm = document.getElementById("userShareForm");
    if (userShareForm) {
        userShareForm.addEventListener("submit", function(e) {
            e.preventDefault();
            handleMaterialSubmission('userMatYear', 'userMatSem', 'userMatSubject', 'userMatCategory', 'userMatTitle', 'userMatUrl', false);
            userShareForm.reset();
            alert("Study material shared successfully!");
            showHome();
        });
    }

    // Clear History Button
    const clearHistoryBtn = document.getElementById("clearHistoryBtn");
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener("click", function() {
            localStorage.setItem("study_suppliers_history", JSON.stringify([]));
            renderHistoryList();
        });
    }
}

// Core Material Submission logic (Syncs with Database / LocalStorage)
function handleMaterialSubmission(yearId, semId, subId, catId, titleId, urlId, isAdminUpload) {
    const year = document.getElementById(yearId).value;
    const sem = document.getElementById(semId).value;
    const subject = document.getElementById(subId).value;
    const category = document.getElementById(catId).value;
    const title = document.getElementById(titleId).value;
    const url = document.getElementById(urlId).value;

    const newMaterial = {
        id: Date.now().toString(),
        year,
        sem,
        subject,
        category,
        title,
        url,
        uploadedBy: currentUser ? currentUser.email : "Anonymous",
        date: new Date().toLocaleDateString()
    };

    let allMaterials = getLocalData("study_suppliers_materials");
    allMaterials.push(newMaterial);
    setLocalData("study_suppliers_materials", allMaterials);

    if (isAdminUpload) {
        renderAdminMaterialsList();
    }
}

// Navigation and UI View Switchers
function switchAuthMode(mode) {
    const regForm = document.getElementById("registerForm");
    const loginForm = document.getElementById("loginForm");
    const forgotForm = document.getElementById("forgotForm");
    const adminLoginForm = document.getElementById("adminLoginForm");
    const tabReg = document.getElementById("tabRegisterBtn");
    const tabLogin = document.getElementById("tabLoginBtn");

    regForm.classList.add("hidden");
    loginForm.classList.add("hidden");
    forgotForm.classList.add("hidden");
    adminLoginForm.classList.add("hidden");

    if (tabReg) tabReg.classList.remove("active");
    if (tabLogin) tabLogin.classList.remove("active");

    if (mode === 'register') {
        regForm.classList.remove("hidden");
        if (tabReg) tabReg.classList.add("active");
    } else if (mode === 'login') {
        loginForm.classList.remove("hidden");
        if (tabLogin) tabLogin.classList.add("active");
    }
}

function openAdminModal(e) {
    if (e) e.preventDefault();
    document.getElementById("registerForm").classList.add("hidden");
    document.getElementById("loginForm").classList.add("hidden");
    document.getElementById("forgotForm").classList.add("hidden");
    document.getElementById("mainAuthTabs").classList.add("hidden");
    document.getElementById("adminLoginForm").classList.remove("hidden");
}

function closeAdminModal(e) {
    if (e) e.preventDefault();
    document.getElementById("adminLoginForm").classList.add("hidden");
    document.getElementById("mainAuthTabs").classList.remove("hidden");
    switchAuthMode('login');
}

function toggleForgotView(e) {
    if (e) e.preventDefault();
    const loginForm = document.getElementById("loginForm");
    const forgotForm = document.getElementById("forgotForm");
    loginForm.classList.toggle("hidden");
    forgotForm.classList.toggle("hidden");
}

function logoutUser() {
    localStorage.removeItem("active_user");
    currentUser = null;
    checkInitialAuthFlow();
}

function hideAllViews() {
    const views = [
        "courseSelectionView", 
        "semesterSelectionView", 
        "subjectSelectionView", 
        "materialsDetailView", 
        "userUploadView", 
        "userDownloadsView", 
        "adminPanelView"
    ];
    views.forEach(v => {
        const el = document.getElementById(v);
        if (el) el.classList.add("hidden");
    });
}

function showHome() {
    hideAllViews();
    const homeView = document.getElementById("courseSelectionView");
    if (homeView) homeView.classList.remove("hidden");
}

function openUserUploadPanel() {
    hideAllViews();
    const uploadView = document.getElementById("userUploadView");
    if (uploadView) uploadView.classList.remove("hidden");
}

function openUserDownloads() {
    hideAllViews();
    const dlView = document.getElementById("userDownloadsView");
    if (dlView) dlView.classList.remove("hidden");
    renderUserDownloads();
}

function openAdminPanel() {
    hideAllViews();
    const adminView = document.getElementById("adminPanelView");
    if (adminView) adminView.classList.remove("hidden");
    renderAdminMaterialsList();
}

// Academic Flow Navigation
function openYear(yearKey) {
    currentSelectedYear = yearKey;
    hideAllViews();
    document.getElementById("semesterSelectionView").classList.remove("hidden");
    document.getElementById("selectedYearTitle").innerText = bcomCaSyllabus[yearKey].title + " - Select Semester";

    const semGrid = document.getElementById("semesterGrid");
    semGrid.innerHTML = "";
    
    const sems = bcomCaSyllabus[yearKey].semesters;
    for (let semKey in sems) {
        const semObj = sems[semKey];
        semGrid.innerHTML += `
            <div class="course-card" onclick="openSemester('${semKey}')">
                <i class="fa-solid fa-bookmark course-icon"></i>
                <h3>${semObj.title}</h3>
                <p>Explore Subjects & Materials</p>
                <button type="button" class="explore-btn">Open Semester <i class="fa-solid fa-arrow-right"></i></button>
            </div>
        `;
    }
}

function backToSemesters() {
    openYear(currentSelectedYear);
}

function openSemester(semKey) {
    currentSelectedSem = semKey;
    hideAllViews();
    document.getElementById("subjectSelectionView").classList.remove("hidden");
    document.getElementById("selectedSemTitle").innerText = "Select Subject";

    const subGrid = document.getElementById("subjectGrid");
    subGrid.innerHTML = "";

    const subjects = bcomCaSyllabus[currentSelectedYear].semesters[semKey].subjects;
    subjects.forEach(sub => {
        subGrid.innerHTML += `
            <div class="course-card" onclick="openSubject('${sub.name}')">
                <i class="fa-solid fa-book course-icon"></i>
                <h3>${sub.name}</h3>
                <p>${sub.isPractical ? 'Practical & Theory Notes' : 'Theory & Question Papers'}</p>
                <button type="button" class="explore-btn">View Materials <i class="fa-solid fa-arrow-right"></i></button>
            </div>
        `;
    });
}

function backToSubjects() {
    openSemester(currentSelectedSem);
}

function openSubject(subjectName) {
    currentSelectedSubject = subjectName;
    hideAllViews();
    document.getElementById("materialsDetailView").classList.remove("hidden");
    document.getElementById("selectedSubjectTitle").innerText = subjectName + " - Study Materials";

    renderSubjectMaterials(currentSelectedYear, currentSelectedSem, subjectName);
}

function renderSubjectMaterials(year, sem, subject) {
    const grid = document.getElementById("materialsGrid");
    grid.innerHTML = "";

    const allMaterials = getLocalData("study_suppliers_materials");
    const filtered = allMaterials.filter(m => m.year === year && m.sem === sem && m.subject === subject);

    if (filtered.length === 0) {
        grid.innerHTML = `<p class="empty-msg">No study materials uploaded for this subject yet.</p>`;
        return;
    }

    filtered.forEach(mat => {
        grid.innerHTML += `
            <div class="material-card" style="background:#fff; padding:15px; margin-bottom:10px; border-radius:8px; border:1px solid #cbd5e1;">
                <h4>${mat.title}</h4>
                <p style="font-size:0.85rem; color:#64748b;">Category: ${mat.category} | Uploaded by: ${mat.uploadedBy}</p>
                <div style="margin-top:10px;">
                    <a href="${mat.url}" target="_blank" class="submit-btn" style="display:inline-block; text-decoration:none; padding:8px 15px;" onclick="logActivity('${mat.title}')">Open / Download PDF</a>
                    <button type="button" onclick='savePdfToUserList(${JSON.stringify(mat)})' class="submit-btn" style="background:#0ea5e9; display:inline-block; margin-left:10px; padding:8px 15px;">Save to My PDFs</button>
                </div>
            </div>
        `;
    });
}

// Form Dropdown Dynamic Populators
function populateFormSemesters(yearId, semId, subId) {
    const year = document.getElementById(yearId).value;
    const semSelect = document.getElementById(semId);
    semSelect.innerHTML = `<option value="">2. Select Semester</option>`;
    
    if (!year) return;

    const sems = bcomCaSyllabus[year].semesters;
    for (let key in sems) {
        semSelect.innerHTML += `<option value="${key}">${sems[key].title}</option>`;
    }
}

function populateFormSubjects(yearId, semId, subId) {
    const year = document.getElementById(yearId).value;
    const sem = document.getElementById(semId).value;
    const subSelect = document.getElementById(subId);
    subSelect.innerHTML = `<option value="">3. Select Subject</option>`;

    if (!year || !sem) return;

    const subjects = bcomCaSyllabus[year].semesters[sem].subjects;
    subjects.forEach(sub => {
        subSelect.innerHTML += `<option value="${sub.name}">${sub.name}</option>`;
    });
}

function populateCategories(yearId, semId, subId, catId) {
    const catSelect = document.getElementById(catId);
    catSelect.innerHTML = `
        <option value="">4. Select Category</option>
        <option value="Notes">Unit Notes</option>
        <option value="Practical File">Practical File</option>
        <option value="Question Paper">Question Paper</option>
        <option value="Assignment">Assignment</option>
    `;
}

// Activity Log & Downloads Management
function logActivity(title) {
    let history = getLocalData("study_suppliers_history");
    history.unshift({ title, time: new Date().toLocaleTimeString() });
    setLocalData("study_suppliers_history", history);
    renderHistoryList();
}

function renderHistoryList() {
    const list = document.getElementById("historyList");
    const countEl = document.getElementById("downloadCount");
    let history = getLocalData("study_suppliers_history");

    if (countEl) countEl.innerText = history.length;
    if (!list) return;

    if (history.length === 0) {
        list.innerHTML = `<li class="empty-msg">No activity recorded.</li>`;
        return;
    }

    list.innerHTML = "";
    history.forEach(item => {
        list.innerHTML += `<li>Accessed: <b>${item.title}</b> <span style="font-size:0.75rem; color:#94a3b8;">(${item.time})</span></li>`;
    });
}

function savePdfToUserList(mat) {
    let saved = getLocalData("study_suppliers_saved_pdfs");
    if (!saved.some(s => s.id === mat.id)) {
        saved.push(mat);
        setLocalData("study_suppliers_saved_pdfs", saved);
        updateDownloadBadgeCount();
        alert("PDF saved to your library!");
    } else {
        alert("PDF already exists in your saved list.");
    }
}

function updateDownloadBadgeCount() {
    let saved = getLocalData("study_suppliers_saved_pdfs");
    const badge = document.getElementById("dlNavBadge");
    if (badge) badge.innerText = saved.length;
}

function renderUserDownloads() {
