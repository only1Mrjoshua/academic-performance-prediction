// Global variables
let students = [];
let courses = [];

// Optional: Log which URL is being used (helpful for debugging)
console.log('Admin page - Using API URL:', API_BASE);

// Add spinner animation
const style = document.createElement("style");
style.textContent = `
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    .spinner {
        display: inline-block;
        width: 30px;
        height: 30px;
        border: 3px solid #f3f3f3;
        border-top: 3px solid #3498db;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }
`;
document.head.appendChild(style);

// Load data on page load
document.addEventListener("DOMContentLoaded", function () {
    console.log("👨‍💼 Admin page loaded");
    loadAllData();
});

// Load all data
async function loadAllData() {
    try {
        // Show loading states
        showLoading("students");
        showLoading("courses");

        // Load both students and courses in parallel
        const [studentsData, coursesData] = await Promise.all([
            apiCall("/admin/students/").catch((err) => {
                console.error("Failed to load students:", err);
                return [];
            }),
            apiCall("/admin/courses/").catch((err) => {
                console.error("Failed to load courses:", err);
                return [];
            }),
        ]);

        // Update global variables
        students = studentsData || [];
        courses = coursesData || [];

        console.log("📊 Data loaded:", {
            students: students.length,
            courses: courses.length,
        });

        // Display the data
        displayStudents();
        displayCourses();
    } catch (error) {
        console.error("❌ Error loading data:", error);
        showAlert("Failed to load data. Please refresh the page.", "danger");
    }
}

// Show loading indicators
function showLoading(type) {
    if (type === "students") {
        document.getElementById("studentsBody").innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 30px;">
                    <div class="spinner"></div>
                    <p style="margin-top: 10px; color: #666;">Loading students...</p>
                </td>
            </tr>
        `;
    } else if (type === "courses") {
        document.getElementById("coursesBody").innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; padding: 30px;">
                    <div class="spinner"></div>
                    <p style="margin-top: 10px; color: #666;">Loading courses...</p>
                </td>
            </tr>
        `;
    }
}

// Display students in table
function displayStudents() {
    console.log("👥 Displaying students...");
    const tbody = document.getElementById("studentsBody");

    if (!tbody) {
        console.error("❌ studentsBody element not found!");
        return;
    }

    if (!students || students.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 30px; color: #666;">
                    <p style="font-size: 16px; margin-bottom: 10px;">📋 No students found</p>
                    <p style="font-size: 14px;">Click "Add Student" to add your first student.</p>
                </td>
            </tr>
        `;
        return;
    }

    let html = "";
    students.forEach((student) => {
        html += `
            <tr data-student-id="${student.id}">
                <td><strong>${escapeHtml(student.name)}</strong></td>
                <td>${escapeHtml(student.matric_no)}</td>
                <td>${escapeHtml(student.department)}</td>
                <td>${student.level}</td>
                <td>
                    <button class="btn btn-warning btn-sm" onclick="editStudent('${student.id}')">Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteStudent('${student.id}')">Delete</button>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
    console.log(`✅ Displayed ${students.length} students`);
}

// Display courses in table
function displayCourses() {
    console.log("📚 Displaying courses...");
    const tbody = document.getElementById("coursesBody");

    if (!tbody) {
        console.error("❌ coursesBody element not found!");
        return;
    }

    if (!courses || courses.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; padding: 30px; color: #666;">
                    <p style="font-size: 16px; margin-bottom: 10px;">📚 No courses found</p>
                    <p style="font-size: 14px;">Click "Add Course" to add your first course.</p>
                </td>
            </tr>
        `;
        return;
    }

    let html = "";
    courses.forEach((course) => {
        html += `
            <tr data-course-id="${course.id}">
                <td><strong>${escapeHtml(course.course_code)}</strong></td>
                <td>${escapeHtml(course.course_title)}</td>
                <td>${course.credit_unit}</td>
                <td>
                    <button class="btn btn-warning btn-sm" onclick="editCourse('${course.id}')">Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteCourse('${course.id}')">Delete</button>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
    console.log(`✅ Displayed ${courses.length} courses`);
}

// Escape HTML to prevent XSS attacks
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Students CRUD
async function loadStudents() {
    try {
        students = await apiCall("/admin/students/");
        displayStudents();
    } catch (error) {
        console.error("Failed to load students:", error);
        showAlert("Failed to load students", "danger");
    }
}

function editStudent(id) {
    const student = students.find((s) => s.id === id);
    if (student) {
        document.getElementById("studentId").value = student.id;
        document.getElementById("studentName").value = student.name;
        document.getElementById("studentMatric").value = student.matric_no;
        document.getElementById("studentDepartment").value = student.department;
        document.getElementById("studentLevel").value = student.level;
        document.getElementById("studentModalTitle").textContent = "Edit Student";
        openModal("studentModal");
    } else {
        // If not found in local array, fetch from API
        apiCall(`/admin/students/${id}`)
            .then((student) => {
                document.getElementById("studentId").value = student.id;
                document.getElementById("studentName").value = student.name;
                document.getElementById("studentMatric").value = student.matric_no;
                document.getElementById("studentDepartment").value = student.department;
                document.getElementById("studentLevel").value = student.level;
                document.getElementById("studentModalTitle").textContent = "Edit Student";
                openModal("studentModal");
            })
            .catch((error) => {
                console.error("Failed to load student for edit:", error);
                showAlert("Failed to load student details", "danger");
            });
    }
}

async function deleteStudent(id) {
    if (confirm("Are you sure you want to delete this student? This action cannot be undone.")) {
        try {
            await apiCall(`/admin/students/${id}`, "DELETE");
            showAlert("Student deleted successfully");

            // Remove from local array and update display
            students = students.filter((s) => s.id !== id);
            displayStudents();
        } catch (error) {
            console.error("Failed to delete student:", error);
            showAlert("Failed to delete student", "danger");
        }
    }
}

async function saveStudent(event) {
    event.preventDefault();

    if (!validateForm("studentForm")) return;

    const studentData = {
        name: document.getElementById("studentName").value.trim(),
        matric_no: document.getElementById("studentMatric").value.trim(),
        department: document.getElementById("studentDepartment").value.trim(),
        level: parseInt(document.getElementById("studentLevel").value),
    };

    // Validate required fields
    if (!studentData.name || !studentData.matric_no || !studentData.department || !studentData.level) {
        showAlert("Please fill in all fields", "danger");
        return;
    }

    const studentId = document.getElementById("studentId").value;

    try {
        let response;
        if (studentId) {
            response = await apiCall(`/admin/students/${studentId}`, "PUT", studentData);
            showAlert("Student updated successfully");

            // Update local array
            const index = students.findIndex((s) => s.id === studentId);
            if (index !== -1) {
                students[index] = { ...students[index], ...studentData, id: studentId };
            }
        } else {
            response = await apiCall("/admin/students/", "POST", studentData);
            showAlert("Student added successfully");

            // Add to local array
            students.push(response);
        }

        closeModal("studentModal");
        document.getElementById("studentForm").reset();
        document.getElementById("studentId").value = "";
        document.getElementById("studentModalTitle").textContent = "Add Student";

        // Refresh display
        displayStudents();
    } catch (error) {
        console.error("Failed to save student:", error);
        showAlert("Failed to save student: " + (error.message || "Unknown error"), "danger");
    }
}

// Courses CRUD
async function loadCourses() {
    try {
        courses = await apiCall("/admin/courses/");
        displayCourses();
    } catch (error) {
        console.error("Failed to load courses:", error);
        showAlert("Failed to load courses", "danger");
    }
}

function editCourse(id) {
    const course = courses.find((c) => c.id === id);
    if (course) {
        document.getElementById("courseId").value = course.id;
        document.getElementById("courseCode").value = course.course_code;
        document.getElementById("courseTitle").value = course.course_title;
        document.getElementById("creditUnit").value = course.credit_unit;
        document.getElementById("courseModalTitle").textContent = "Edit Course";
        openModal("courseModal");
    } else {
        apiCall(`/admin/courses/${id}`)
            .then((course) => {
                document.getElementById("courseId").value = course.id;
                document.getElementById("courseCode").value = course.course_code;
                document.getElementById("courseTitle").value = course.course_title;
                document.getElementById("creditUnit").value = course.credit_unit;
                document.getElementById("courseModalTitle").textContent = "Edit Course";
                openModal("courseModal");
            })
            .catch((error) => {
                console.error("Failed to load course for edit:", error);
                showAlert("Failed to load course details", "danger");
            });
    }
}

async function deleteCourse(id) {
    if (confirm("Are you sure you want to delete this course? This action cannot be undone.")) {
        try {
            await apiCall(`/admin/courses/${id}`, "DELETE");
            showAlert("Course deleted successfully");

            // Remove from local array and update display
            courses = courses.filter((c) => c.id !== id);
            displayCourses();
        } catch (error) {
            console.error("Failed to delete course:", error);
            showAlert("Failed to delete course", "danger");
        }
    }
}

async function saveCourse(event) {
    event.preventDefault();

    if (!validateForm("courseForm")) return;

    const courseData = {
        course_code: document.getElementById("courseCode").value.trim().toUpperCase(),
        course_title: document.getElementById("courseTitle").value.trim(),
        credit_unit: parseInt(document.getElementById("creditUnit").value),
    };

    // Validate required fields
    if (!courseData.course_code || !courseData.course_title || !courseData.credit_unit) {
        showAlert("Please fill in all fields", "danger");
        return;
    }

    const courseId = document.getElementById("courseId").value;

    try {
        let response;
        if (courseId) {
            response = await apiCall(`/admin/courses/${courseId}`, "PUT", courseData);
            showAlert("Course updated successfully");

            // Update local array
            const index = courses.findIndex((c) => c.id === courseId);
            if (index !== -1) {
                courses[index] = { ...courses[index], ...courseData, id: courseId };
            }
        } else {
            response = await apiCall("/admin/courses/", "POST", courseData);
            showAlert("Course added successfully");

            // Add to local array
            courses.push(response);
        }

        closeModal("courseModal");
        document.getElementById("courseForm").reset();
        document.getElementById("courseId").value = "";
        document.getElementById("courseModalTitle").textContent = "Add Course";

        // Refresh display
        displayCourses();
    } catch (error) {
        console.error("Failed to save course:", error);
        showAlert("Failed to save course: " + (error.message || "Unknown error"), "danger");
    }
}

// Search functionality
function searchStudents() {
    const searchText = document.getElementById("studentSearch").value.toLowerCase().trim();
    const tbody = document.getElementById("studentsBody");
    const rows = tbody.rows;

    if (!rows) return;

    let visibleCount = 0;

    for (let row of rows) {
        if (row.cells && row.cells.length >= 2) {
            const name = row.cells[0].textContent.toLowerCase();
            const matric = row.cells[1].textContent.toLowerCase();

            if (name.includes(searchText) || matric.includes(searchText)) {
                row.style.display = "";
                visibleCount++;
            } else {
                row.style.display = "none";
            }
        }
    }

    // Show "no results" message if needed
    const existingNoResults = document.getElementById("noSearchResults");
    if (existingNoResults) {
        existingNoResults.remove();
    }

    if (visibleCount === 0 && students.length > 0) {
        const noResultsRow = document.createElement("tr");
        noResultsRow.id = "noSearchResults";
        noResultsRow.innerHTML = `
            <td colspan="5" style="text-align: center; padding: 20px; color: #666;">
                <p>🔍 No students matching "${searchText}"</p>
            </td>
        `;
        tbody.appendChild(noResultsRow);
    }
}

// Debug functions
function debugStudents() {
    const output = document.getElementById("debugOutput");
    output.innerHTML = "<h4>👥 Students Debug:</h4>";
    output.innerHTML += `<p>Local students array: <strong>${students.length}</strong> students</p>`;
    output.innerHTML += "<pre>" + JSON.stringify(students, null, 2) + "</pre>";

    // Also fetch from API to compare - NOW USING API_BASE
    fetch(`${API_BASE}/admin/students/`)
        .then((r) => r.json())
        .then((data) => {
            output.innerHTML += `<hr><h4>📡 API Response:</h4>`;
            output.innerHTML += `<p>API returned <strong>${data.length}</strong> students</p>`;
            output.innerHTML += "<pre>" + JSON.stringify(data, null, 2) + "</pre>";
        })
        .catch((err) => {
            output.innerHTML += `<p style="color: red;">❌ API Error: ${err.message}</p>`;
        });
}

function debugCourses() {
    const output = document.getElementById("debugOutput");
    output.innerHTML = "<h4>📚 Courses Debug:</h4>";
    output.innerHTML += `<p>Local courses array: <strong>${courses.length}</strong> courses</p>`;
    output.innerHTML += "<pre>" + JSON.stringify(courses, null, 2) + "</pre>";

    // Also fetch from API to compare - NOW USING API_BASE
    fetch(`${API_BASE}/admin/courses/`)
        .then((r) => r.json())
        .then((data) => {
            output.innerHTML += `<hr><h4>📡 API Response:</h4>`;
            output.innerHTML += `<p>API returned <strong>${data.length}</strong> courses</p>`;
            output.innerHTML += "<pre>" + JSON.stringify(data, null, 2) + "</pre>";
        })
        .catch((err) => {
            output.innerHTML += `<p style="color: red;">❌ API Error: ${err.message}</p>`;
        });
}

function forceReload() {
    console.log("🔄 Force reloading all data...");
    showAlert("Reloading data...", "info");
    loadAllData();
}

// Override original functions
window.loadStudents = loadStudents;
window.loadCourses = loadCourses;