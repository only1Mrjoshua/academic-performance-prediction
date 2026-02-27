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
    `;
    document.head.appendChild(style);
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
        showAlert("Failed to load data. Please refresh the page.", "danger");
    }
}

// Show loading indicators
function showLoading(type) {
    if (type === "assessments") {
        const tbody = document.getElementById("assessmentsBody");
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 30px;">
                        <div style="display: inline-block; width: 30px; height: 30px; border: 3px solid #f3f3f3; border-top: 3px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                        <p style="margin-top: 10px; color: #666;">Loading assessments...</p>
                    </td>
                </tr>
            `;
        }
    } else if (type === "attendance") {
        const tbody = document.getElementById("attendanceBody");
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center; padding: 30px;">
                        <div style="display: inline-block; width: 30px; height: 30px; border: 3px solid #f3f3f3; border-top: 3px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                        <p style="margin-top: 10px; color: #666;">Loading attendance...</p>
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
                <td colspan="7" style="text-align: center; padding: 30px; color: #666;">
                    <p style="font-size: 16px; margin-bottom: 10px;">📊 No assessments found</p>
                    <p style="font-size: 14px;">Click "Add Assessment" to create your first assessment.</p>
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
                <tr>
                    <td>${escapeHtml(student.name)}</td>
                    <td>${escapeHtml(course.course_code)}</td>
                    <td>${assessment.test_score || 0}</td>
                    <td>${assessment.assignment_score || 0}</td>
                    <td>${assessment.exam_score || 0}</td>
                    <td><strong>${total}</strong></td>
                    <td>
                        <button class="btn btn-warning btn-sm" onclick="editAssessment('${escapeHtml(assessment.id)}')">Edit</button>
                        <button class="btn btn-danger btn-sm" onclick="deleteAssessment('${escapeHtml(assessment.id)}')">Delete</button>
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
                <td colspan="7" style="text-align: center; padding: 30px; color: #e74c3c;">
                    <p>❌ Found ${assessments.length} assessments but couldn't match with students/courses.</p>
                    <p style="font-size: 12px;">Check console for details.</p>
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
                <td colspan="4" style="text-align: center; padding: 30px; color: #666;">
                    <p style="font-size: 16px; margin-bottom: 10px;">📋 No attendance records found</p>
                    <p style="font-size: 14px;">Click "Add Attendance" to add attendance records.</p>
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
            html += `
                <tr>
                    <td>${escapeHtml(student.name)}</td>
                    <td>${escapeHtml(course.course_code)}</td>
                    <td>${record.attendance_percentage || 0}%</td>
                    <td>
                        <button class="btn btn-warning btn-sm" onclick="editAttendance('${escapeHtml(record.id)}')">Edit</button>
                        <button class="btn btn-danger btn-sm" onclick="deleteAttendance('${escapeHtml(record.id)}')">Delete</button>
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
        showAlert("Failed to load assessments", "danger");
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
    if (confirm("Are you sure you want to delete this assessment?")) {
        try {
            await apiCall(`/lecturer/assessments/${id}`, "DELETE");
            showAlert("Assessment deleted successfully");
            await loadAssessments(); // Reload assessments
        } catch (error) {
            console.error("Failed to delete assessment:", error);
            showAlert("Failed to delete assessment", "danger");
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
            showAlert("Assessment updated successfully");
        } else {
            await apiCall("/lecturer/assessments/", "POST", assessmentData);
            showAlert("Assessment added successfully");
        }

        closeModal("assessmentModal");
        document.getElementById("assessmentForm").reset();
        document.getElementById("assessmentId").value = "";
        document.getElementById("assessmentModalTitle").textContent = "Add Assessment";

        // Reload all data to ensure everything is in sync
        await loadAllData();
    } catch (error) {
        console.error("Failed to save assessment:", error);
        showAlert("Failed to save assessment: " + error.message, "danger");
    }
}

// Attendance CRUD operations
async function loadAttendance() {
    try {
        attendance = await apiCall("/lecturer/attendance/");
        displayAttendance();
    } catch (error) {
        console.error("Failed to load attendance:", error);
        showAlert("Failed to load attendance", "danger");
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
    if (confirm("Are you sure you want to delete this attendance record?")) {
        try {
            await apiCall(`/lecturer/attendance/${id}`, "DELETE");
            showAlert("Attendance deleted successfully");
            await loadAttendance(); // Reload attendance
        } catch (error) {
            console.error("Failed to delete attendance:", error);
            showAlert("Failed to delete attendance", "danger");
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
            showAlert("Attendance updated successfully");
        } else {
            await apiCall("/lecturer/attendance/", "POST", attendanceData);
            showAlert("Attendance added successfully");
        }

        closeModal("attendanceModal");
        document.getElementById("attendanceForm").reset();
        document.getElementById("attendanceId").value = "";
        document.getElementById("attendanceModalTitle").textContent = "Add Attendance";

        // Reload all data
        await loadAllData();
    } catch (error) {
        console.error("Failed to save attendance:", error);
        showAlert("Failed to save attendance: " + error.message, "danger");
    }
}

// Prediction functions
async function trainModel() {
    try {
        showAlert("Training model...", "info");
        const result = await apiCall("/prediction/train", "POST");
        showAlert(
            "Model trained successfully! Accuracy: " +
            ((result.metrics?.accuracy || 0) * 100).toFixed(2) +
            "%",
        );
    } catch (error) {
        console.error("Failed to train model:", error);
        showAlert("Failed to train model", "danger");
    }
}

async function generateAllPredictions() {
    try {
        showAlert("Generating predictions...", "info");
        const result = await apiCall("/prediction/generate-all", "POST");
        showAlert(
            `Generated predictions for ${result.predictions?.length || 0} students`,
        );
    } catch (error) {
        console.error("Failed to generate predictions:", error);
        showAlert("Failed to generate predictions", "danger");
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
    showAlert("Reloading data...", "info");
    loadAllData();
}

// Override the original load functions to use our new ones
window.loadAssessments = loadAssessments;
window.loadAttendance = loadAttendance;