from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum

# MongoDB document models
class Student(BaseModel):
    id: Optional[str] = None
    name: str
    matric_no: str
    department: str
    level: int

class Course(BaseModel):
    id: Optional[str] = None
    course_code: str
    course_title: str
    credit_unit: int

class Enrollment(BaseModel):
    student_id: str
    course_id: str
    semester: str

class Assessment(BaseModel):
    student_id: str
    course_id: str
    test_score: float = Field(ge=0, le=30)
    assignment_score: float = Field(ge=0, le=20)
    exam_score: float = Field(ge=0, le=50)

class Attendance(BaseModel):
    student_id: str
    course_id: str
    attendance_percentage: float = Field(ge=0, le=100)

class RiskStatus(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"

class Prediction(BaseModel):
    student_id: str
    predicted_score: float
    risk_status: RiskStatus
    created_at: datetime = datetime.now()

# Response models
class StudentResponse(Student):
    id: str

class CourseResponse(Course):
    id: str

class AssessmentResponse(Assessment):
    id: str

class AttendanceResponse(Attendance):
    id: str

class PredictionResponse(Prediction):
    id: str

# Dashboard models
class RiskStatistics(BaseModel):
    total_students: int
    low_risk: int
    medium_risk: int
    high_risk: int
    low_risk_percentage: float
    medium_risk_percentage: float
    high_risk_percentage: float

class StudentRiskDetail(BaseModel):
    student_id: str
    student_name: str
    matric_no: str
    level: int
    department: str
    predicted_score: float
    risk_status: RiskStatus
    attendance_percentage: Optional[float] = None
    assessment_average: Optional[float] = None

# ML Model Evaluation
class ModelMetrics(BaseModel):
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    confusion_matrix: list