// Global variables - API_BASE comes from main.js via config.js
let students = [];
let courses = [];
let assessments = [];
let attendance = [];

// Optional: Log which URL is being used
console.log('📝 Lecturer page - Using API URL:', API_BASE);

// Initialize on page load
document.addEventListener("DOMContentLoaded", function () {
    console.log("📝 Lecturer page loaded");
    
    // Create toast container if it doesn't exist
    if (!document.getElementById('toast-container')) {
        const toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'fixed bottom-4 right-4 z-[100] flex flex-col gap-2';
        document.body.appendChild(toastContainer);
    }
    
    loadAllData();
});

// Add spinner animation (only if not already added)
if (!document.getElementById('lecturer-spinner-style')) {
    const style = document.createElement("style");
    style.id = 'lecturer-spinner-style';
    style.textContent = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}

// Toast notification system
function showToast(message, type = 'success', duration = 4000) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    
    // Define styles based on type
    const bgColor = {
        success: 'bg-green-50 border-green-200 text-green-800',
        error: 'bg-red-50 border-red-200 text-red-800',
        warning: 'bg-amber-50 border-amber-200 text-amber-800',
        info: 'bg-blue-50 border-blue-200 text-blue-800'
    }[type] || 'bg-slate-50 border-slate-200 text-slate-800';
    
    const iconColor = {
        success: 'text-green-500',
        error: 'text-red-500',
        warning: 'text-amber-500',
        info: 'text-blue-500'
    }[type] || 'text-slate-500';
    
    const icon = {
        success: 'check_circle',
        error: 'error',
        warning: 'warning',
        info: 'info'
    }[type] || 'notifications';
    
    toast.className = `flex items-center gap-3 px-4 py-3 rounded-xl border ${bgColor} shadow-lg backdrop-blur-sm min-w-[300px] max-w-md animate-[slideIn_0.3s_ease]`;
    toast.style.animation = 'slideIn 0.3s ease';
    
    toast.innerHTML = `
        <span class="material-symbols-outlined ${iconColor}">${icon}</span>
        <span class="flex-1 text-sm font-medium">${message}</span>
        <button onclick="this.parentElement.remove()" class="text-slate-400 hover:text-slate-600">
            <span class="material-symbols-outlined text-lg">close</span>
        </button>
    `;
    
    container.appendChild(toast);
    
    // Auto remove after duration
    setTimeout(() => {
        if (toast.parentElement) {
            toast.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }
    }, duration);
}

// Replace showAlert with toast
function showAlert(message, type = 'success') {
    // Map old types to new toast types
    const toastType = {
        'success': 'success',
        'danger': 'error',
        'warning': 'warning',
        'info': 'info'
    }[type] || 'info';
    
    showToast(message, toastType);
}

// Custom confirm dialog with styled modal
async function showConfirm(message) {
    return new Promise((resolve) => {
        // Create confirm modal container
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-center justify-center';
        modalOverlay.style.animation = 'fadeIn 0.2s ease';
        
        const modal = document.createElement('div');
        modal.className = 'bg-white rounded-2xl max-w-[400px] w-full mx-4 p-6 shadow-2xl border border-primary/15';
        modal.innerHTML = `
            <div class="flex items-start gap-4 mb-6">
                <div class="w-10 h-10 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center">
                    <span class="material-symbols-outlined text-2xl">help</span>
                </div>
                <div class="flex-1">
                    <h3 class="text-lg font-bold text-slate-900 mb-2">Confirm Action</h3>
                    <p class="text-slate-600 text-sm">${message}</p>
                </div>
            </div>
            <div class="flex flex-col sm:flex-row gap-3">
                <button class="flex-1 bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-4 rounded-xl transition-all text-sm" id="confirm-yes">Yes, proceed</button>
                <button class="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold py-3 px-4 rounded-xl transition-all text-sm" id="confirm-no">Cancel</button>
            </div>
        `;
        
        modalOverlay.appendChild(modal);
        document.body.appendChild(modalOverlay);
        
        // Handle clicks
        document.getElementById('confirm-yes').addEventListener('click', () => {
            document.body.removeChild(modalOverlay);
            resolve(true);
        });
        
        document.getElementById('confirm-no').addEventListener('click', () => {
            document.body.removeChild(modalOverlay);
            resolve(false);
        });
        
        // Close on overlay click
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                document.body.removeChild(modalOverlay);
                resolve(false);
            }
        });
    });
}

// Load all data in parallel for better performance
async function loadAllData() {
    try {
        // Show loading states
        showLoading("assessments");
        showLoading("attendance");

        // Load all data in parallel
        const [studentsData, coursesData, assessmentsData, attendanceData] =
            await Promise.all([
                apiCall("/admin/students/").catch((err) => {
                    console.error("Failed to load students:", err);
                    return [];
                }),
                apiCall("/admin/courses/").catch((err) => {
                    console.error("Failed to load courses:", err);
                    return [];
                }),
                apiCall("/lecturer/assessments/").catch((err) => {
                    console.error("Failed to load assessments:", err);
                    return [];
                }),
                apiCall("/lecturer/attendance/").catch((err) => {
                    console.error("Failed to load attendance:", err);
                    return [];
                }),
            ]);

        // Update global variables
        students = studentsData || [];
        courses = coursesData || [];
        assessments = assessmentsData || [];
        attendance = attendanceData || [];

        console.log("📊 Data loaded:", {
            students: students.length,
            courses: courses.length,
            assessments: assessments.length,
            attendance: attendance.length,
        });

        // Populate dropdowns and display data
        populateSelects();
        displayAssessments();
        displayAttendance();
    } catch (error) {
        console.error("❌ Error loading data:", error);
        showToast("Failed to load data. Please refresh the page.", "error");
    }
}

// Show loading indicators
function showLoading(type) {
    if (type === "assessments") {
        const tbody = document.getElementById("assessmentsBody");
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-12">
                        <div class="spinner mx-auto"></div>
                        <p class="mt-4 text-sm text-slate-500">Loading assessments...</p>
                    </td>
                </tr>
            `;
        }
    } else if (type === "attendance") {
        const tbody = document.getElementById("attendanceBody");
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center py-12">
                        <div class="spinner mx-auto"></div>
                        <p class="mt-4 text-sm text-slate-500">Loading attendance...</p>
                    </td>
                </tr>
            `;
        }
    }
}

// Escape HTML to prevent XSS attacks
function escapeHtml(unsafe) {
    if (unsafe === null || unsafe === undefined) return '';
    // Convert to string if it's not already a string
    const str = typeof unsafe !== 'string' ? String(unsafe) : unsafe;
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Populate dropdown selects
function populateSelects() {
    console.log(
        "Populating dropdowns with",
        students.length,
        "students and",
        courses.length,
        "courses",
    );

    // Assessment student select
    const assessmentStudent = document.getElementById("assessmentStudent");
    if (assessmentStudent) {
        assessmentStudent.innerHTML = '<option value="">Select Student</option>';
        students.forEach((student) => {
            assessmentStudent.innerHTML += `<option value="${escapeHtml(student.id)}">${escapeHtml(student.name)} (${escapeHtml(student.matric_no)})</option>`;
        });
    }

    // Assessment course select
    const assessmentCourse = document.getElementById("assessmentCourse");
    if (assessmentCourse) {
        assessmentCourse.innerHTML = '<option value="">Select Course</option>';
        courses.forEach((course) => {
            assessmentCourse.innerHTML += `<option value="${escapeHtml(course.id)}">${escapeHtml(course.course_code)} - ${escapeHtml(course.course_title)}</option>`;
        });
    }

    // Attendance student select
    const attendanceStudent = document.getElementById("attendanceStudent");
    if (attendanceStudent) {
        attendanceStudent.innerHTML = '<option value="">Select Student</option>';
        students.forEach((student) => {
            attendanceStudent.innerHTML += `<option value="${escapeHtml(student.id)}">${escapeHtml(student.name)} (${escapeHtml(student.matric_no)})</option>`;
        });
    }

    // Attendance course select
    const attendanceCourse = document.getElementById("attendanceCourse");
    if (attendanceCourse) {
        attendanceCourse.innerHTML = '<option value="">Select Course</option>';
        courses.forEach((course) => {
            attendanceCourse.innerHTML += `<option value="${escapeHtml(course.id)}">${escapeHtml(course.course_code)} - ${escapeHtml(course.course_title)}</option>`;
        });
    }
}

// Display assessments in table
function displayAssessments() {
    console.log("📝 Displaying assessments...");
    const tbody = document.getElementById("assessmentsBody");

    if (!tbody) {
        console.error("❌ assessmentsBody element not found!");
        return;
    }

    if (!assessments || assessments.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-12">
                    <span class="material-symbols-outlined text-4xl text-slate-300 mb-2">assignment</span>
                    <p class="text-slate-500 font-medium">📊 No assessments found</p>
                    <p class="text-sm text-slate-400 mt-1">Click "Add Assessment" to create your first assessment.</p>
                </td>
            </tr>
        `;
        return;
    }

    let html = "";
    let displayCount = 0;

    assessments.forEach((assessment) => {
        // Find matching student and course
        const student = students.find((s) => s.id === assessment.student_id);
        const course = courses.find((c) => c.id === assessment.course_id);

        if (student && course) {
            const total = (assessment.test_score || 0) + 
                         (assessment.assignment_score || 0) + 
                         (assessment.exam_score || 0);
            displayCount++;

            html += `
                <tr class="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td class="py-4 pl-2">${escapeHtml(student.name)}</td>
                    <td class="py-4">${escapeHtml(course.course_code)}</td>
                    <td class="py-4">${assessment.test_score || 0}</td>
                    <td class="py-4">${assessment.assignment_score || 0}</td>
                    <td class="py-4">${assessment.exam_score || 0}</td>
                    <td class="py-4"><span class="font-bold text-primary">${total}</span></td>
                    <td class="py-4 pr-2">
                        <div class="flex items-center gap-2">
                            <button onclick="editAssessment('${escapeHtml(assessment.id)}')" 
                                class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all flex items-center gap-1">
                                <span class="material-symbols-outlined text-sm">edit</span> Edit
                            </button>
                            <button onclick="deleteAssessment('${escapeHtml(assessment.id)}')" 
                                class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-600 transition-all flex items-center gap-1">
                                <span class="material-symbols-outlined text-sm">delete</span> Delete
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        } else {
            console.warn("⚠️ Could not match assessment:", {
                assessment,
                studentFound: !!student,
                courseFound: !!course,
            });
        }
    });

    if (displayCount === 0 && assessments.length > 0) {
        html = `
            <tr>
                <td colspan="7" class="text-center py-12">
                    <span class="material-symbols-outlined text-4xl text-amber-300 mb-2">warning</span>
                    <p class="text-amber-600 font-medium">❌ Found ${assessments.length} assessments but couldn't match with students/courses.</p>
                    <p class="text-sm text-slate-400 mt-1">Check console for details.</p>
                </td>
            </tr>
        `;
    }

    tbody.innerHTML = html;
    console.log(
        `✅ Displayed ${displayCount} out of ${assessments.length} assessments`,
    );
}

// Display attendance in table
function displayAttendance() {
    console.log("📊 Displaying attendance...");
    const tbody = document.getElementById("attendanceBody");

    if (!tbody) {
        console.error("❌ attendanceBody element not found!");
        return;
    }

    if (!attendance || attendance.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center py-12">
                    <span class="material-symbols-outlined text-4xl text-slate-300 mb-2">event_available</span>
                    <p class="text-slate-500 font-medium">📋 No attendance records found</p>
                    <p class="text-sm text-slate-400 mt-1">Click "Add Attendance" to add attendance records.</p>
                </td>
            </tr>
        `;
        return;
    }

    let html = "";
    let displayCount = 0;

    attendance.forEach((record) => {
        const student = students.find((s) => s.id === record.student_id);
        const course = courses.find((c) => c.id === record.course_id);

        if (student && course) {
            displayCount++;
            
            // Determine color based on attendance percentage
            let badgeColor = "text-green-600 bg-green-50";
            if (record.attendance_percentage < 75) badgeColor = "text-amber-600 bg-amber-50";
            if (record.attendance_percentage < 60) badgeColor = "text-red-600 bg-red-50";
            
            html += `
                <tr class="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td class="py-4 pl-2">${escapeHtml(student.name)}</td>
                    <td class="py-4">${escapeHtml(course.course_code)}</td>
                    <td class="py-4">
                        <span class="px-2 py-1 rounded-full text-xs font-semibold ${badgeColor}">
                            ${record.attendance_percentage || 0}%
                        </span>
                    </td>
                    <td class="py-4 pr-2">
                        <div class="flex items-center gap-2">
                            <button onclick="editAttendance('${escapeHtml(record.id)}')" 
                                class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all flex items-center gap-1">
                                <span class="material-symbols-outlined text-sm">edit</span> Edit
                            </button>
                            <button onclick="deleteAttendance('${escapeHtml(record.id)}')" 
                                class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-600 transition-all flex items-center gap-1">
                                <span class="material-symbols-outlined text-sm">delete</span> Delete
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }
    });

    tbody.innerHTML = html;
    console.log(
        `✅ Displayed ${displayCount} out of ${attendance.length} attendance records`,
    );
}

// Assessment CRUD operations
async function loadAssessments() {
    try {
        assessments = await apiCall("/lecturer/assessments/");
        displayAssessments();
    } catch (error) {
        console.error("Failed to load assessments:", error);
        showToast("Failed to load assessments", "error");
    }
}

function editAssessment(id) {
    const assessment = assessments.find((a) => a.id === id);
    if (assessment) {
        document.getElementById("assessmentId").value = assessment.id || '';
        document.getElementById("assessmentStudent").value = assessment.student_id || '';
        document.getElementById("assessmentCourse").value = assessment.course_id || '';
        document.getElementById("testScore").value = assessment.test_score || 0;
        document.getElementById("assignmentScore").value = assessment.assignment_score || 0;
        document.getElementById("examScore").value = assessment.exam_score || 0;
        document.getElementById("assessmentModalTitle").textContent = "Edit Assessment";
        openModal("assessmentModal");
    }
}

async function deleteAssessment(id) {
    const confirmed = await showConfirm("Are you sure you want to delete this assessment?");
    if (confirmed) {
        try {
            await apiCall(`/lecturer/assessments/${id}`, "DELETE");
            showToast("Assessment deleted successfully", "success");
            await loadAssessments(); // Reload assessments
        } catch (error) {
            console.error("Failed to delete assessment:", error);
            showToast("Failed to delete assessment", "error");
        }
    }
}

async function saveAssessment(event) {
    event.preventDefault();

    if (!validateForm("assessmentForm")) return;

    const assessmentData = {
        student_id: document.getElementById("assessmentStudent").value,
        course_id: document.getElementById("assessmentCourse").value,
        test_score: parseFloat(document.getElementById("testScore").value) || 0,
        assignment_score: parseFloat(document.getElementById("assignmentScore").value) || 0,
        exam_score: parseFloat(document.getElementById("examScore").value) || 0,
    };

    const assessmentId = document.getElementById("assessmentId").value;

    try {
        if (assessmentId) {
            await apiCall(
                `/lecturer/assessments/${assessmentId}`,
                "PUT",
                assessmentData,
            );
            showToast("Assessment updated successfully", "success");
        } else {
            await apiCall("/lecturer/assessments/", "POST", assessmentData);
            showToast("Assessment added successfully", "success");
        }

        closeModal("assessmentModal");
        document.getElementById("assessmentForm").reset();
        document.getElementById("assessmentId").value = "";
        document.getElementById("assessmentModalTitle").textContent = "Add Assessment";

        // Reload all data to ensure everything is in sync
        await loadAllData();
    } catch (error) {
        console.error("Failed to save assessment:", error);
        showToast("Failed to save assessment: " + error.message, "error");
    }
}

// Attendance CRUD operations
async function loadAttendance() {
    try {
        attendance = await apiCall("/lecturer/attendance/");
        displayAttendance();
    } catch (error) {
        console.error("Failed to load attendance:", error);
        showToast("Failed to load attendance", "error");
    }
}

function editAttendance(id) {
    const record = attendance.find((a) => a.id === id);
    if (record) {
        document.getElementById("attendanceId").value = record.id || '';
        document.getElementById("attendanceStudent").value = record.student_id || '';
        document.getElementById("attendanceCourse").value = record.course_id || '';
        document.getElementById("attendancePercentage").value = record.attendance_percentage || 0;
        document.getElementById("attendanceModalTitle").textContent = "Edit Attendance";
        openModal("attendanceModal");
    }
}

async function deleteAttendance(id) {
    const confirmed = await showConfirm("Are you sure you want to delete this attendance record?");
    if (confirmed) {
        try {
            await apiCall(`/lecturer/attendance/${id}`, "DELETE");
            showToast("Attendance deleted successfully", "success");
            await loadAttendance(); // Reload attendance
        } catch (error) {
            console.error("Failed to delete attendance:", error);
            showToast("Failed to delete attendance", "error");
        }
    }
}

async function saveAttendance(event) {
    event.preventDefault();

    if (!validateForm("attendanceForm")) return;

    const attendanceData = {
        student_id: document.getElementById("attendanceStudent").value,
        course_id: document.getElementById("attendanceCourse").value,
        attendance_percentage: parseFloat(document.getElementById("attendancePercentage").value) || 0,
    };

    const attendanceId = document.getElementById("attendanceId").value;

    try {
        if (attendanceId) {
            await apiCall(
                `/lecturer/attendance/${attendanceId}`,
                "PUT",
                attendanceData,
            );
            showToast("Attendance updated successfully", "success");
        } else {
            await apiCall("/lecturer/attendance/", "POST", attendanceData);
            showToast("Attendance added successfully", "success");
        }

        closeModal("attendanceModal");
        document.getElementById("attendanceForm").reset();
        document.getElementById("attendanceId").value = "";
        document.getElementById("attendanceModalTitle").textContent = "Add Attendance";

        // Reload all data
        await loadAllData();
    } catch (error) {
        console.error("Failed to save attendance:", error);
        showToast("Failed to save attendance: " + error.message, "error");
    }
}

// Prediction functions
async function trainModel() {
    try {
        showToast("Training model...", "info");
        const result = await apiCall("/prediction/train", "POST");
        showToast(
            "Model trained successfully! Accuracy: " +
            ((result.metrics?.accuracy || 0) * 100).toFixed(2) +
            "%",
            "success"
        );
    } catch (error) {
        console.error("Failed to train model:", error);
        showToast("Failed to train model", "error");
    }
}

async function generateAllPredictions() {
    try {
        showToast("Generating predictions...", "info");
        const result = await apiCall("/prediction/generate-all", "POST");
        showToast(
            `Generated predictions for ${result.predictions?.length || 0} students`,
            "success"
        );
    } catch (error) {
        console.error("Failed to generate predictions:", error);
        showToast("Failed to generate predictions", "error");
    }
}

// Debug functions - UPDATED TO USE API_BASE
function debugAssessments() {
    const output = document.getElementById("debugOutput");
    if (!output) return;
    
    output.innerHTML = "<h4>📊 Assessments Debug:</h4>";

    fetch(`${API_BASE}/lecturer/assessments/`)
        .then((r) => r.json())
        .then((data) => {
            output.innerHTML += `<p>Found <strong>${data.length}</strong> assessments in database</p>`;
            if (data.length > 0) {
                output.innerHTML += "<pre>" + JSON.stringify(data, null, 2) + "</pre>";
            } else {
                output.innerHTML += '<p style="color: orange;">⚠️ No assessments found in database</p>';
            }
        })
        .catch((err) => {
            output.innerHTML += '<p style="color: red;">❌ Error: ' + err.message + "</p>";
        });
}

function debugStudents() {
    const output = document.getElementById("debugOutput");
    if (!output) return;
    
    output.innerHTML = "<h4>👥 Students Debug:</h4>";
    output.innerHTML += `<p>Local students array: <strong>${students.length}</strong> students</p>`;
    output.innerHTML += "<pre>" + JSON.stringify(students, null, 2) + "</pre>";
}

function debugCourses() {
    const output = document.getElementById("debugOutput");
    if (!output) return;
    
    output.innerHTML = "<h4>📚 Courses Debug:</h4>";
    output.innerHTML += `<p>Local courses array: <strong>${courses.length}</strong> courses</p>`;
    output.innerHTML += "<pre>" + JSON.stringify(courses, null, 2) + "</pre>";
}

function forceReload() {
    console.log("🔄 Force reloading all data...");
    showToast("Reloading data...", "info");
    loadAllData();
}

// Override the original load functions to use our new ones
window.loadAssessments = loadAssessments;
window.loadAttendance = loadAttendance;