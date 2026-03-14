// lecturer.js - Premium UI version

let assessments = [];
let attendanceRecords = [];
let students = [];
let courses = [];

console.log(
  "Lecturer page - Using API URL:",
  typeof API_BASE !== "undefined" ? API_BASE : "API_BASE not defined",
);

// ---------- Helpers ----------
function escapeHtml(unsafe) {
  if (unsafe === null || unsafe === undefined) return "";
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatOneDecimal(value, fallback = "0.0") {
  if (value === null || value === undefined || value === "") return fallback;
  return Number(value).toFixed(1);
}

function actionButtonSvg(type) {
  if (type === "edit") {
    return `
      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 20h9"/>
        <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"/>
      </svg>
    `;
  }

  return `
    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M3 6h18"/>
      <path stroke-linecap="round" stroke-linejoin="round" d="M8 6V4h8v2"/>
      <path stroke-linecap="round" stroke-linejoin="round" d="M19 6l-1 14H6L5 6"/>
      <path stroke-linecap="round" stroke-linejoin="round" d="M10 11v6M14 11v6"/>
    </svg>
  `;
}

function emptyStateSvg(kind = "generic") {
  if (kind === "assessment") {
    return `
      <svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
        <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487a1.875 1.875 0 1 1 2.652 2.652L7.5 19.154 3 20.25l1.096-4.5 12.766-12.263Z"/>
      </svg>
    `;
  }

  if (kind === "attendance") {
    return `
      <svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
        <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 6.75V4.5m7.5 2.25V4.5M3.75 9.75h16.5M6 20.25h12A2.25 2.25 0 0 0 20.25 18V8.25A2.25 2.25 0 0 0 18 6H6A2.25 2.25 0 0 0 3.75 8.25V18A2.25 2.25 0 0 0 6 20.25Z"/>
      </svg>
    `;
  }

  return `
    <svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <circle cx="11" cy="11" r="7"></circle>
      <path stroke-linecap="round" stroke-linejoin="round" d="m20 20-3.5-3.5"></path>
    </svg>
  `;
}

function emptyStateRow(colspan, title, subtitle, kind = "generic") {
  return `
    <tr>
      <td colspan="${colspan}" class="py-16 text-center">
        <div class="flex flex-col items-center justify-center gap-4 text-slate-400">
          <div class="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
            ${emptyStateSvg(kind)}
          </div>
          <div class="space-y-1">
            <p class="text-slate-600 font-semibold">${title}</p>
            <p class="text-sm text-slate-400">${subtitle}</p>
          </div>
        </div>
      </td>
    </tr>
  `;
}

function loadingRow(colspan, label) {
  return `
    <tr>
      <td colspan="${colspan}" class="py-14 text-center">
        <div class="spinner"></div>
        <p class="mt-4 text-sm text-slate-500">${label}</p>
      </td>
    </tr>
  `;
}

function percentBadgeClass(value) {
  const num = Number(value);
  if (Number.isNaN(num)) return "bg-slate-100 text-slate-700 border border-slate-200";
  if (num < 50) return "bg-red-50 text-red-700 border border-red-100";
  if (num < 70) return "bg-amber-50 text-amber-700 border border-amber-100";
  return "bg-emerald-50 text-emerald-700 border border-emerald-100";
}

// ---------- Init ----------
document.addEventListener("DOMContentLoaded", async function () {
  console.log("Lecturer page loaded");
  await loadInitialData();
});

// ---------- Data loading ----------
async function loadInitialData() {
  try {
    showAssessmentLoading();
    showAttendanceLoading();

    const [studentsData, coursesData, assessmentData, attendanceData] =
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

    students = Array.isArray(studentsData) ? studentsData : [];
    courses = Array.isArray(coursesData) ? coursesData : [];
    assessments = Array.isArray(assessmentData) ? assessmentData : [];
    attendanceRecords = Array.isArray(attendanceData) ? attendanceData : [];

    populateStudentSelects();
    populateCourseSelects();
    displayAssessments();
    displayAttendance();
  } catch (error) {
    console.error("Failed to initialize lecturer page:", error);
    showToast("Failed to load lecturer data", "error");
  }
}

function showAssessmentLoading() {
  const tbody = document.getElementById("assessmentsBody");
  if (tbody) tbody.innerHTML = loadingRow(7, "Loading assessments...");
}

function showAttendanceLoading() {
  const tbody = document.getElementById("attendanceBody");
  if (tbody) tbody.innerHTML = loadingRow(4, "Loading attendance records...");
}

// ---------- Select population ----------
function populateStudentSelects() {
  const ids = ["assessmentStudent", "attendanceStudent"];

  ids.forEach((id) => {
    const select = document.getElementById(id);
    if (!select) return;

    const currentValue = select.value;
    select.innerHTML = `<option value="">Select Student</option>`;

    students.forEach((student) => {
      select.innerHTML += `
        <option value="${escapeHtml(student.id)}">
          ${escapeHtml(student.name)} (${escapeHtml(student.matric_no)})
        </option>
      `;
    });

    if (currentValue) select.value = currentValue;
  });
}

function populateCourseSelects() {
  const ids = ["assessmentCourse", "attendanceCourse"];

  ids.forEach((id) => {
    const select = document.getElementById(id);
    if (!select) return;

    const currentValue = select.value;
    select.innerHTML = `<option value="">Select Course</option>`;

    courses.forEach((course) => {
      select.innerHTML += `
        <option value="${escapeHtml(course.id)}">
          ${escapeHtml(course.course_code)} — ${escapeHtml(course.course_title)}
        </option>
      `;
    });

    if (currentValue) select.value = currentValue;
  });
}

// ---------- Render assessments ----------
function displayAssessments() {
  const tbody = document.getElementById("assessmentsBody");
  if (!tbody) return;

  if (!assessments.length) {
    tbody.innerHTML = emptyStateRow(
      7,
      "No assessments found",
      'Click "Add Assessment" to create the first record.',
      "assessment",
    );
    return;
  }

  let html = "";

  assessments.forEach((item) => {
    const studentName =
      item.student_name ||
      students.find((s) => s.id === item.student_id)?.name ||
      "Unknown Student";

    const courseName =
      item.course_code ||
      courses.find((c) => c.id === item.course_id)?.course_code ||
      "Unknown Course";

    const testScore = Number(item.test_score || 0);
    const assignmentScore = Number(item.assignment_score || 0);
    const examScore = Number(item.exam_score || 0);
    const total = testScore + assignmentScore + examScore;

    html += `
      <tr class="hover:bg-slate-50 transition-colors">
        <td class="px-5 py-4 font-semibold text-slate-900">${escapeHtml(studentName)}</td>
        <td class="px-5 py-4">
          <span class="inline-flex items-center rounded-xl bg-blue-50 px-3 py-1.5 font-mono text-sm font-semibold text-primary border border-blue-100">
            ${escapeHtml(courseName)}
          </span>
        </td>
        <td class="px-5 py-4 text-slate-700">${formatOneDecimal(testScore)}</td>
        <td class="px-5 py-4 text-slate-700">${formatOneDecimal(assignmentScore)}</td>
        <td class="px-5 py-4 text-slate-700">${formatOneDecimal(examScore)}</td>
        <td class="px-5 py-4 font-semibold text-primary">${formatOneDecimal(total)}</td>
        <td class="px-5 py-4">
          <div class="flex items-center gap-2">
            <button
              onclick="editAssessment('${escapeHtml(item.id)}')"
              class="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-blue-50 hover:text-primary hover:border-blue-100 transition-all"
              title="Edit assessment"
              aria-label="Edit assessment"
            >
              ${actionButtonSvg("edit")}
            </button>
            <button
              onclick="deleteAssessment('${escapeHtml(item.id)}')"
              class="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all"
              title="Delete assessment"
              aria-label="Delete assessment"
            >
              ${actionButtonSvg("delete")}
            </button>
          </div>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

// ---------- Render attendance ----------
function displayAttendance() {
  const tbody = document.getElementById("attendanceBody");
  if (!tbody) return;

  if (!attendanceRecords.length) {
    tbody.innerHTML = emptyStateRow(
      4,
      "No attendance records found",
      'Click "Add Attendance" to create the first record.',
      "attendance",
    );
    return;
  }

  let html = "";

  attendanceRecords.forEach((item) => {
    const studentName =
      item.student_name ||
      students.find((s) => s.id === item.student_id)?.name ||
      "Unknown Student";

    const courseName =
      item.course_code ||
      courses.find((c) => c.id === item.course_id)?.course_code ||
      "Unknown Course";

    const attendancePercentage = Number(item.attendance_percentage || 0);

    html += `
      <tr class="hover:bg-slate-50 transition-colors">
        <td class="px-5 py-4 font-semibold text-slate-900">${escapeHtml(studentName)}</td>
        <td class="px-5 py-4">
          <span class="inline-flex items-center rounded-xl bg-blue-50 px-3 py-1.5 font-mono text-sm font-semibold text-primary border border-blue-100">
            ${escapeHtml(courseName)}
          </span>
        </td>
        <td class="px-5 py-4">
          <span class="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${percentBadgeClass(attendancePercentage)}">
            ${formatOneDecimal(attendancePercentage)}%
          </span>
        </td>
        <td class="px-5 py-4">
          <div class="flex items-center gap-2">
            <button
              onclick="editAttendance('${escapeHtml(item.id)}')"
              class="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-blue-50 hover:text-primary hover:border-blue-100 transition-all"
              title="Edit attendance"
              aria-label="Edit attendance"
            >
              ${actionButtonSvg("edit")}
            </button>
            <button
              onclick="deleteAttendance('${escapeHtml(item.id)}')"
              class="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all"
              title="Delete attendance"
              aria-label="Delete attendance"
            >
              ${actionButtonSvg("delete")}
            </button>
          </div>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

// ---------- Assessment CRUD ----------
function editAssessment(id) {
  const item = assessments.find((a) => a.id === id);
  if (!item) {
    showToast("Assessment record not found", "error");
    return;
  }

  document.getElementById("assessmentId").value = item.id;
  document.getElementById("assessmentStudent").value = item.student_id || "";
  document.getElementById("assessmentCourse").value = item.course_id || "";
  document.getElementById("testScore").value = item.test_score ?? "";
  document.getElementById("assignmentScore").value = item.assignment_score ?? "";
  document.getElementById("examScore").value = item.exam_score ?? "";
  document.getElementById("assessmentModalTitle").textContent = "Edit Assessment";
  openModal("assessmentModal");
}

async function saveAssessment(event) {
  event.preventDefault();

  if (!validateForm("assessmentForm")) return;

  const payload = {
    student_id: document.getElementById("assessmentStudent").value,
    course_id: document.getElementById("assessmentCourse").value,
    test_score: parseFloat(document.getElementById("testScore").value),
    assignment_score: parseFloat(document.getElementById("assignmentScore").value),
    exam_score: parseFloat(document.getElementById("examScore").value),
  };

  const assessmentId = document.getElementById("assessmentId").value;

  try {
    if (assessmentId) {
      const updated = await apiCall(`/lecturer/assessments/${assessmentId}`, "PUT", payload);
      const index = assessments.findIndex((a) => a.id === assessmentId);
      if (index !== -1) assessments[index] = updated || { ...assessments[index], ...payload, id: assessmentId };
      showToast("Assessment updated successfully", "success");
    } else {
      const created = await apiCall("/lecturer/assessments/", "POST", payload);
      assessments.push(created);
      showToast("Assessment added successfully", "success");
    }

    resetAssessmentForm();
    closeModal("assessmentModal");
    displayAssessments();
  } catch (error) {
    console.error("Failed to save assessment:", error);
    showToast(`Failed to save assessment: ${error.message || "Unknown error"}`, "error");
  }
}

async function deleteAssessment(id) {
  const confirmed = await showConfirm(
    "Are you sure you want to delete this assessment record? This action cannot be undone.",
  );
  if (!confirmed) return;

  try {
    await apiCall(`/lecturer/assessments/${id}`, "DELETE");
    assessments = assessments.filter((a) => a.id !== id);
    displayAssessments();
    showToast("Assessment deleted successfully", "success");
  } catch (error) {
    console.error("Failed to delete assessment:", error);
    showToast("Failed to delete assessment", "error");
  }
}

function resetAssessmentForm() {
  const form = document.getElementById("assessmentForm");
  if (form) form.reset();
  document.getElementById("assessmentId").value = "";
  document.getElementById("assessmentModalTitle").textContent = "Add Assessment";
}

// ---------- Attendance CRUD ----------
function editAttendance(id) {
  const item = attendanceRecords.find((a) => a.id === id);
  if (!item) {
    showToast("Attendance record not found", "error");
    return;
  }

  document.getElementById("attendanceId").value = item.id;
  document.getElementById("attendanceStudent").value = item.student_id || "";
  document.getElementById("attendanceCourse").value = item.course_id || "";
  document.getElementById("attendancePercentage").value =
    item.attendance_percentage ?? "";
  document.getElementById("attendanceModalTitle").textContent = "Edit Attendance";
  openModal("attendanceModal");
}

async function saveAttendance(event) {
  event.preventDefault();

  if (!validateForm("attendanceForm")) return;

  const payload = {
    student_id: document.getElementById("attendanceStudent").value,
    course_id: document.getElementById("attendanceCourse").value,
    attendance_percentage: parseFloat(
      document.getElementById("attendancePercentage").value,
    ),
  };

  const attendanceId = document.getElementById("attendanceId").value;

  try {
    if (attendanceId) {
      const updated = await apiCall(`/lecturer/attendance/${attendanceId}`, "PUT", payload);
      const index = attendanceRecords.findIndex((a) => a.id === attendanceId);
      if (index !== -1) {
        attendanceRecords[index] =
          updated || { ...attendanceRecords[index], ...payload, id: attendanceId };
      }
      showToast("Attendance updated successfully", "success");
    } else {
      const created = await apiCall("/lecturer/attendance/", "POST", payload);
      attendanceRecords.push(created);
      showToast("Attendance added successfully", "success");
    }

    resetAttendanceForm();
    closeModal("attendanceModal");
    displayAttendance();
  } catch (error) {
    console.error("Failed to save attendance:", error);
    showToast(`Failed to save attendance: ${error.message || "Unknown error"}`, "error");
  }
}

async function deleteAttendance(id) {
  const confirmed = await showConfirm(
    "Are you sure you want to delete this attendance record? This action cannot be undone.",
  );
  if (!confirmed) return;

  try {
    await apiCall(`/lecturer/attendance/${id}`, "DELETE");
    attendanceRecords = attendanceRecords.filter((a) => a.id !== id);
    displayAttendance();
    showToast("Attendance deleted successfully", "success");
  } catch (error) {
    console.error("Failed to delete attendance:", error);
    showToast("Failed to delete attendance", "error");
  }
}

function resetAttendanceForm() {
  const form = document.getElementById("attendanceForm");
  if (form) form.reset();
  document.getElementById("attendanceId").value = "";
  document.getElementById("attendanceModalTitle").textContent = "Add Attendance";
}

// ---------- AI actions ----------
async function trainModel() {
  const button = document.querySelector('button[onclick="trainModel()"]');
  if (button) {
    button.disabled = true;
    button.textContent = "Training...";
  }

  try {
    await apiCall("/prediction/train", "POST");
    showToast("Model training completed successfully", "success");
  } catch (error) {
    console.error("Failed to train model:", error);
    showToast("Failed to train model", "error");
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = "Train Model";
    }
  }
}

async function generateAllPredictions() {
  const button = document.querySelector(
    'button[onclick="generateAllPredictions()"]',
  );
  if (button) {
    button.disabled = true;
    button.textContent = "Generating...";
  }

  try {
    const result = await apiCall("/prediction/generate-all", "POST");
    showToast(
      `Generated predictions for ${result.predictions?.length || 0} students`,
      "success",
    );
  } catch (error) {
    console.error("Failed to generate predictions:", error);
    showToast("Failed to generate predictions", "error");
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = "Generate All Predictions";
    }
  }
}

// ---------- Reload helpers ----------
async function reloadAssessments() {
  try {
    assessments = await apiCall("/lecturer/assessments/");
    displayAssessments();
  } catch (error) {
    console.error("Failed to reload assessments:", error);
  }
}

async function reloadAttendance() {
  try {
    attendanceRecords = await apiCall("/lecturer/attendance/");
    displayAttendance();
  } catch (error) {
    console.error("Failed to reload attendance:", error);
  }
}

// ---------- Expose ----------
window.editAssessment = editAssessment;
window.saveAssessment = saveAssessment;
window.deleteAssessment = deleteAssessment;
window.editAttendance = editAttendance;
window.saveAttendance = saveAttendance;
window.deleteAttendance = deleteAttendance;
window.trainModel = trainModel;
window.generateAllPredictions = generateAllPredictions;
window.reloadAssessments = reloadAssessments;
window.reloadAttendance = reloadAttendance;