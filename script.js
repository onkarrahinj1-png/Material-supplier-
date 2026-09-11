// EmailJS Credentials Declarations
const EMAILJS_PUBLIC_KEY = "YOUR_PUBLIC_KEY";   // Place your EmailJS Public Key here
const EMAILJS_SERVICE_ID = "YOUR_SERVICE_ID";   // Place your EmailJS Service ID here
const EMAILJS_TEMPLATE_ID = "YOUR_TEMPLATE_ID"; // Place your EmailJS Template ID here

const SECRET_ADMIN_KEY = "admin2020";

// EmailJS Initialization
(function() {
    if (typeof emailjs !== "undefined") {
        try {
            if (EMAILJS_PUBLIC_KEY && EMAILJS_PUBLIC_KEY !== "YOUR_PUBLIC_KEY") {
                emailjs.init(EMAILJS_PUBLIC_KEY);
            }
        } catch (err) {
            console.error("EmailJS Init Error:", err);
        }
    }
})();

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

// LocalStorage Helper
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

function checkInitialAuthFlow() {
    const landingOverlay = document.getElementById("landingAuthOverlay");
    const portalContent = document.getElementById("portalMainContent");

    if (currentUser) {
        landingOverlay.classList.add("hidden");
        portalContent.classList.remove("hidden");
        updateUserStatusUI();
        showHome();
    } else {
        portalContent.classList.add("hidden");
        landingOverlay.classList.remove("hidden");

        const registeredUsers = getLocalData("app_users");
        if (registeredUsers.length > 0) {
            switchAuthMode('login');
        } else {
            switchAuthMode('register');
        }
    }
}

function switchAuthMode(mode) {
    document.getElementById("mainAuthTabs").classList.remove("hidden");
    
    const regBtn = document.getElementById("tabRegisterBtn");
    const loginBtn = document.getElementById("tabLoginBtn");
    const regForm = document.getElementById("registerForm");
    const loginForm = document.getElementById("loginForm");
    const forgotForm = document.getElementById("forgotForm");
    const adminForm = document.getElementById("adminLoginForm");

    forgotForm.classList.add("hidden");
    adminForm.classList.add("hidden");

    if (mode === 'register') {
        regBtn.classList.add("active");
        loginBtn.classList.remove("active");
        regForm.classList.remove("hidden");
        loginForm.classList.add("hidden");
    } else if (mode === 'login') {
        loginBtn.classList.add("active");
        regBtn.classList.remove("active");
        loginForm.classList.remove("hidden");
        regForm.classList.add("hidden");
    }
}

function toggleForgotView(e) {
    if (e) e.preventDefault();
    const forgotForm = document.getElementById("forgotForm");
    const loginForm = document.getElementById("loginForm");
    
    if (forgotForm.classList.contains("hidden")) {
        loginForm.classList.add("hidden");
        forgotForm.classList.remove("hidden");
    } else {
        forgotForm.classList.add("hidden");
        loginForm.classList.remove("hidden");
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
    switchAuthMode('login');
}

function updateUserStatusUI() {
    const greeting = document.getElementById("userGreeting");
    const adminNavBtn = document.getElementById("adminNavBtn");

    if (currentUser) {
        greeting.textContent = `Logged in: ${currentUser.name || 'Admin'} - [${currentUser.role.toUpperCase()}]`;
        if (currentUser.role === "admin") {
            adminNavBtn.classList.remove("hidden");
        } else {
            adminNavBtn.classList.add("hidden");
        }
    }
}

function setupAuthAndFormEvents() {
    // 1. Fixed Registration Form Event
    document.getElementById("registerForm").onsubmit = function (e) {
        e.preventDefault();
        const name = document.getElementById("regName").value.trim();
        const username = document.getElementById("regUsername").value.trim();
        const userId = document.getElementById("regUserId").value.trim();
        const email = document.getElementById("regEmail").value.trim();
        const password = document.getElementById("regPassword").value;

        if (!name || !email || !password) {
            alert("Please fill in all required fields!");
            return;
        }

        const users = getLocalData("app_users");
        if (users.some(u => u.email === email)) {
            alert("This email is already registered! Please login.");
            switchAuthMode('login');
            return;
        }

        const newUser = { name, username, userId, email, password, role: "student" };
        users.push(newUser);
        setLocalData("app_users", users);

        alert("Registration Successful! Now you can login.");
        document.getElementById("registerForm").reset();
        switchAuthMode('login');
    };

    // 2. Fixed Login Form Event
    document.getElementById("loginForm").onsubmit = function (e) {
        e.preventDefault();
        const email = document.getElementById("loginEmail").value.trim();
        const password = document.getElementById("loginPassword").value;

        const users = getLocalData("app_users");
        const found = users.find(u => u.email === email && u.password === password);

        if (found) {
            currentUser = found;
            localStorage.setItem("active_user", JSON.stringify(currentUser));
            checkInitialAuthFlow();
        } else {
            alert("Invalid Email or Password!");
        }
    };

    // 3. Admin Login Event
    document.getElementById("adminLoginForm").onsubmit = function (e) {
        e.preventDefault();
        const email = document.getElementById("adminEmail").value.trim();
        const password = document.getElementById("adminPassword").value;
        const key = document.getElementById("adminKeyInput").value.trim();

        if (key !== SECRET_ADMIN_KEY) {
            alert("Invalid Secret Key!");
            return;
        }

        currentUser = { name: "Admin", email: email, role: "admin" };
        localStorage.setItem("active_user", JSON.stringify(currentUser));
        checkInitialAuthFlow();
    };

    // 4. Forgot Password Event
    document.getElementById("forgotForm").onsubmit = function (e) {
        e.preventDefault();
        const userEmail = document.getElementById("forgotEmail").value.trim();
        const submitBtn = this.querySelector(".submit-btn");

        if (!EMAILJS_PUBLIC_KEY || EMAILJS_PUBLIC_KEY === "YOUR_PUBLIC_KEY") {
            alert("EmailJS is not configured yet! Please update credentials in script.js");
            return;
        }

        submitBtn.innerText = "Sending Email...";
        submitBtn.disabled = true;

        const templateParams = {
            to_email: userEmail,
            message: "Password reset request received for Study Suppliers account."
        };

        emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams)
            .then(function() {
                alert("Password reset link sent to: " + userEmail);
                switchAuthMode('login');
            }, function(error) {
                alert("Failed to send email. Check EmailJS configuration.");
            })
            .finally(function() {
                submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Send Password Reset Link';
                submitBtn.disabled = false;
            });
    };

    document.getElementById("userShareForm").onsubmit = function (e) {
        e.preventDefault();
        handleSaveMaterial("userMatYear", "userMatSem", "userMatSubject", "userMatCategory", "userMatTitle", "userMatUrl");
        document.getElementById("userShareForm").reset();
    };

    document.getElementById("addMaterialForm").onsubmit = function (e) {
        e.preventDefault();
        handleSaveMaterial("adminMatYear", "adminMatSem", "adminMatSubject", "adminMatCategory", "adminMatTitle", "adminMatUrl");
        document.getElementById("addMaterialForm").reset();
        renderAdminMaterialsList();
    };

    document.getElementById("clearHistoryBtn").onclick = function() {
        setLocalData("activity_logs", []);
        renderHistoryList();
    };
}

function logoutUser() {
    localStorage.removeItem("active_user");
    currentUser = null;
    checkInitialAuthFlow();
}

function hideAllViews() {
    const views = document.querySelectorAll(".view-section");
    views.forEach(v => v.classList.add("hidden"));
}

function populateFormSemesters(yId, sId, subjId) {
    const yVal = document.getElementById(yId).value;
    const semSelect = document.getElementById(sId);
    document.getElementById(subjId).innerHTML = '<option value="">3. Select Subject</option>';

    semSelect.innerHTML = '<option value="">2. Select Semester</option>';
    if (!yVal || !bcomCaSyllabus[yVal]) return;

    Object.keys(bcomCaSyllabus[yVal].semesters).forEach(sKey => {
        const opt = document.createElement("option");
        opt.value = sKey;
        opt.textContent = bcomCaSyllabus[yVal].semesters[sKey].title;
        semSelect.appendChild(opt);
    });
}

function populateFormSubjects(yId, sId, subjId) {
    const yVal = document.getElementById(yId).value;
    const sVal = document.getElementById(sId).value;
    const subjSelect = document.getElementById(subjId);

    subjSelect.innerHTML = '<option value="">3. Select Subject</option>';
    if (!yVal || !sVal || !bcomCaSyllabus[yVal].semesters[sVal]) return;

    bcomCaSyllabus[yVal].semesters[sVal].subjects.forEach(subj => {
        const opt = document.createElement("option");
        opt.value = subj.name;
        opt.textContent = subj.name + (subj.isPractical ? " [Practical]" : "");
        subjSelect.appendChild(opt);
    });
}

function populateCategories(yId, sId, subjId, catId) {
    const yVal = document.getElementById(yId).value;
    const sVal = document.getElementById(sId).value;
    const subjVal = document.getElementById(subjId).value;
    const catSelect = document.getElementById(catId);

    catSelect.innerHTML = '<option value="">4. Select Category</option>';
    if (!yVal || !sVal || !subjVal) return;

    const subjObj = bcomCaSyllabus[yVal].semesters[sVal].subjects.find(s => s.name === subjVal);

    catSelect.appendChild(new Option("Textbooks / Notes", "Textbooks & Notes"));
    catSelect.appendChild(new Option("Question Papers", "Question Papers"));
    catSelect.appendChild(new Option("Reference PDFs", "Reference PDFs"));

    if (subjObj && subjObj.isPractical) {
        catSelect.appendChild(new Option("Practical Files", "Practical Files"));
    }
}

function handleSaveMaterial(yId, sId, subjId, catId, titleId, urlId) {
    const year = document.getElementById(yId).value;
    const sem = document.getElementById(sId).value;
    const subject = document.getElementById(subjId).value;
    const category = document.getElementById(catId).value;
    const title = document.getElementById(titleId).value.trim();
    const url = document.getElementById(urlId).value.trim();

    let mats = getLocalData("materials_data");
    mats.unshift({ id: Date.now().toString(), year, sem, subject, category, title, url });
    setLocalData("materials_data", mats);

    alert("PDF Uploaded Successfully!");
    addActivityLog(`Shared PDF: ${title} (${subject})`);
}

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

    const grid = document.getElementById("semesterGrid");
    grid.innerHTML = "";
    Object.keys(yearData.semesters).forEach(sKey => {
        const sem = yearData.semesters[sKey];
        const card = document.createElement("div");
        card.className = "course-card";
        card.onclick = function() { openSemester(yearKey, sKey); };
        card.innerHTML = `<i class="fa-solid fa-book-bookmark course-icon"></i><h3>${sem.title}</h3><p>${sem.subjects.length} Subjects Included</p><button type="button" class="explore-btn">Open Semester</button>`;
        grid.appendChild(card);
    });
}

function backToSemesters() {
    if (currentSelectedYear) openYear(currentSelectedYear);
    else showHome();
}

function openSemester(yearKey, semKey) {
    currentSelectedYear = yearKey;
    currentSelectedSem = semKey;
    hideAllViews();
    document.getElementById("subjectSelectionView").classList.remove("hidden");

    const semData = bcomCaSyllabus[yearKey].semesters[semKey];
    document.getElementById("selectedSemTitle").textContent = `${semData.title} - Select Subject`;

    const grid = document.getElementById("subjectGrid");
    grid.innerHTML = "";
    semData.subjects.forEach(subj => {
        const card = document.createElement("div");
        card.className = "subject-card";
        card.onclick = function() { openSubjectMaterials(yearKey, semKey, subj.name); };
        card.innerHTML = `<i class="fa-solid ${subj.isPractical ? 'fa-laptop-code' : 'fa-book'} subject-icon"></i><h3>${subj.name}</h3><p>${subj.isPractical ? 'Theory & Practical' : 'Theory Subject'}</p><button type="button" class="explore-btn">View PDFs</button>`;
        grid.appendChild(card);
    });
}

function backToSubjects() {
    if (currentSelectedYear && currentSelectedSem) openSemester(currentSelectedYear, currentSelectedSem);
    else showHome();
}

function openSubjectMaterials(yearKey, semKey, subjectName) {
    currentSelectedYear = yearKey;
    currentSelectedSem = semKey;
    currentSelectedSubject = subjectName;

    hideAllViews();
    document.getElementById("materialsDetailView").classList.remove("hidden");
    document.getElementById("selectedSubjectTitle").textContent = `${subjectName} - Study Materials`;

    renderSubjectMaterials(yearKey, semKey, subjectName);
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

function renderSubjectMaterials(yearKey, semKey, subjectName) {
    const grid = document.getElementById("materialsGrid");
    grid.innerHTML = "";

    const allMaterials = getLocalData("materials_data");
    const filtered = allMaterials.filter(m => m.year === yearKey && m.sem === semKey && m.subject === subjectName);

    if (filtered.length === 0) {
        grid.innerHTML = `<div style="text-align:center; padding:30px;"><b>No PDFs uploaded for ${subjectName} yet.</b></div>`;
        return;
    }

    filtered.forEach(item => {
        const { previewUrl, downloadUrl } = processPdfUrls(item.url);
        const card = document.createElement("div");
        card.className = "pdf-item-card";
        card.innerHTML = `
            <div class="pdf-item-header">
                <div><i class="fa-solid fa-file-pdf" style="color:#e11d48;"></i> <b>${item.title}</b> (${item.category})</div>
                <div class="pdf-action-btns">
                    <a href="${previewUrl}" target="_blank" class="action-btn btn-open" onclick="trackAndSaveDownload('${item.title}', '${item.url}', 'view')">View</a>
                    <a href="${downloadUrl}" target="_blank" class="action-btn btn-download" onclick="trackAndSaveDownload('${item.title}', '${item.url}', 'download')">Download</a>
                </div>
            </div>
            <iframe src="${previewUrl}" width="100%" height="300" style="margin-top:10px; border-radius:6px; border:1px solid #cbd5e1;"></iframe>
        `;
        grid.appendChild(card);
    });
}

function trackAndSaveDownload(title, url, action) {
    let downloads = getLocalData("user_saved_downloads");
    if (!downloads.some(d => d.pdfTitle === title)) {
        downloads.push({ pdfTitle: title, pdfUrl: url });
        setLocalData("user_saved_downloads", downloads);
    }
    addActivityLog(`${action === 'download' ? 'Downloaded' : 'Viewed'} ${title}`);
    updateDownloadBadgeCount();
}

function updateDownloadBadgeCount() {
    const downloads = getLocalData("user_saved_downloads");
    const badge = document.getElementById("dlNavBadge");
    if (badge) badge.textContent = downloads.length;
}

function openUserUploadPanel() {
    hideAllViews();
    document.getElementById("userUploadView").classList.remove("hidden");
}

function openUserDownloads() {
    hideAllViews();
    document.getElementById("userDownloadsView").classList.remove("hidden");
    renderUserDownloads();
}

function renderUserDownloads() {
    const grid = document.getElementById("userDownloadsGrid");
    grid.innerHTML = "";
    const downloads = getLocalData("user_saved_downloads");

    if (downloads.length === 0) {
        grid.innerHTML = `<div style="text-align:center; padding:30px;"><b>No saved PDFs found.</b></div>`;
        return;
    }

    downloads.forEach((item, index) => {
        const { previewUrl, downloadUrl } = processPdfUrls(item.pdfUrl);
        const card = document.createElement("div");
        card.className = "pdf-item-card";
        card.innerHTML = `
            <div class="pdf-item-header">
                <div><i class="fa-solid fa-file-pdf" style="color:#e11d48;"></i> <b>${item.pdfTitle}</b></div>
                <div class="pdf-action-btns">
                    <a href="${previewUrl}" target="_blank" class="action-btn btn-open">View</a>
                    <a href="${downloadUrl}" target="_blank" class="action-btn btn-download">Download</a>
                    <button type="button" class="action-btn" style="background:#ef4444; color:white;" onclick="removeSavedDownload(${index})">Remove</button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function removeSavedDownload(index) {
    let downloads = getLocalData("user_saved_downloads");
    downloads.splice(index, 1);
    setLocalData("user_saved_downloads", downloads);
    renderUserDownloads();
    updateDownloadBadgeCount();
}

// Fixed Admin Panel View Open Function
function openAdminPanel() {
    if (!currentUser || currentUser.role !== "admin") {
        alert("Access Denied! Only Admin can access.");
        return;
    }
    hideAllViews();
    const adminView = document.getElementById("adminPanelView");
    if (adminView) {
        adminView.classList.remove("hidden");
        renderAdminMaterialsList();
    }
}

function renderAdminMaterialsList() {
    const list = document.getElementById("adminMaterialList");
    list.innerHTML = "";
    const mats = getLocalData("materials_data");

    if (mats.length === 0) {
        list.innerHTML = "<li>No materials uploaded yet.</li>";
        return;
    }

    mats.forEach((m, index) => {
        const li = document.createElement("li");
        li.style.display = "flex";
        li.style.justifyContent = "space-between";
        li.style.alignItems = "center";
        li.style.padding = "8px 0";
        li.style.borderBottom = "1px solid #e2e8f0";

        li.innerHTML = `
            <span><b>${m.title}</b> (${m.year.toUpperCase()} - ${m.subject})</span>
            <button type="button" style="background:#ef4444; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;" onclick="deleteMaterial(${index})">Delete</button>
        `;
        list.appendChild(li);
    });
}

function deleteMaterial(index) {
    let mats = getLocalData("materials_data");
    mats.splice(index, 1);
    setLocalData("materials_data", mats);
    renderAdminMaterialsList();
}

function addActivityLog(msg) {
    let logs = getLocalData("activity_logs");
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    logs.unshift(`[${time}] ${msg}`);
    setLocalData("activity_logs", logs);
    renderHistoryList();
}

function renderHistoryList() {
    const list = document.getElementById("historyList");
    const count = document.getElementById("downloadCount");
    const logs = getLocalData("activity_logs");

    if (count) count.textContent = logs.length;
    if (!list) return;

    list.innerHTML = "";
    if (logs.length === 0) {
        list.innerHTML = '<li class="empty-msg">No activity recorded.</li>';
        return;
    }

    logs.forEach(log => {
        const li = document.createElement("li");
        li.textContent = log;
        li.style.padding = "4px 0";
        li.style.borderBottom = "1px dashed #e2e8f0";
        list.appendChild(li);
    });
}
