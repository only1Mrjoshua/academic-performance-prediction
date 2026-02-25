from fastapi import APIRouter, HTTPException
from bson import ObjectId
from typing import List
from database import (
    assessment_collection, attendance_collection,
    student_collection, course_collection,
    assessment_helper, attendance_helper
)
from models import Assessment, Attendance, AssessmentResponse, AttendanceResponse

router = APIRouter(prefix="/lecturer", tags=["lecturer"])

# Assessment CRUD operations
@router.post("/assessments/", response_model=AssessmentResponse)
async def create_assessment(assessment: Assessment):
    # Verify student and course exist
    student = await student_collection.find_one({"_id": ObjectId(assessment.student_id)})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    course = await course_collection.find_one({"_id": ObjectId(assessment.course_id)})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    assessment_dict = assessment.dict()
    result = await assessment_collection.insert_one(assessment_dict)
    new_assessment = await assessment_collection.find_one({"_id": result.inserted_id})
    return assessment_helper(new_assessment)

@router.get("/assessments/", response_model=List[AssessmentResponse])
async def get_all_assessments():
    assessments = []
    async for assessment in assessment_collection.find():
        assessments.append(assessment_helper(assessment))
    return assessments

@router.get("/assessments/student/{student_id}", response_model=List[AssessmentResponse])
async def get_student_assessments(student_id: str):
    if not ObjectId.is_valid(student_id):
        raise HTTPException(status_code=400, detail="Invalid student ID")
    
    assessments = []
    async for assessment in assessment_collection.find({"student_id": student_id}):
        assessments.append(assessment_helper(assessment))
    return assessments

@router.put("/assessments/{assessment_id}", response_model=AssessmentResponse)
async def update_assessment(assessment_id: str, assessment: Assessment):
    if not ObjectId.is_valid(assessment_id):
        raise HTTPException(status_code=400, detail="Invalid assessment ID")
    
    assessment_dict = assessment.dict()
    result = await assessment_collection.update_one(
        {"_id": ObjectId(assessment_id)}, {"$set": assessment_dict}
    )
    
    if result.modified_count == 1:
        updated_assessment = await assessment_collection.find_one({"_id": ObjectId(assessment_id)})
        return assessment_helper(updated_assessment)
    
    raise HTTPException(status_code=404, detail="Assessment not found")

@router.delete("/assessments/{assessment_id}")
async def delete_assessment(assessment_id: str):
    if not ObjectId.is_valid(assessment_id):
        raise HTTPException(status_code=400, detail="Invalid assessment ID")
    
    result = await assessment_collection.delete_one({"_id": ObjectId(assessment_id)})
    if result.deleted_count == 1:
        return {"message": "Assessment deleted successfully"}
    
    raise HTTPException(status_code=404, detail="Assessment not found")

# Attendance CRUD operations
@router.post("/attendance/", response_model=AttendanceResponse)
async def create_attendance(attendance: Attendance):
    # Verify student and course exist
    student = await student_collection.find_one({"_id": ObjectId(attendance.student_id)})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    course = await course_collection.find_one({"_id": ObjectId(attendance.course_id)})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    attendance_dict = attendance.dict()
    result = await attendance_collection.insert_one(attendance_dict)
    new_attendance = await attendance_collection.find_one({"_id": result.inserted_id})
    return attendance_helper(new_attendance)

@router.get("/attendance/", response_model=List[AttendanceResponse])
async def get_all_attendance():
    attendances = []
    async for attendance in attendance_collection.find():
        attendances.append(attendance_helper(attendance))
    return attendances

@router.get("/attendance/student/{student_id}", response_model=List[AttendanceResponse])
async def get_student_attendance(student_id: str):
    if not ObjectId.is_valid(student_id):
        raise HTTPException(status_code=400, detail="Invalid student ID")
    
    attendances = []
    async for attendance in attendance_collection.find({"student_id": student_id}):
        attendances.append(attendance_helper(attendance))
    return attendances

@router.put("/attendance/{attendance_id}", response_model=AttendanceResponse)
async def update_attendance(attendance_id: str, attendance: Attendance):
    if not ObjectId.is_valid(attendance_id):
        raise HTTPException(status_code=400, detail="Invalid attendance ID")
    
    attendance_dict = attendance.dict()
    result = await attendance_collection.update_one(
        {"_id": ObjectId(attendance_id)}, {"$set": attendance_dict}
    )
    
    if result.modified_count == 1:
        updated_attendance = await attendance_collection.find_one({"_id": ObjectId(attendance_id)})
        return attendance_helper(updated_attendance)
    
    raise HTTPException(status_code=404, detail="Attendance not found")

@router.delete("/attendance/{attendance_id}")
async def delete_attendance(attendance_id: str):
    if not ObjectId.is_valid(attendance_id):
        raise HTTPException(status_code=400, detail="Invalid attendance ID")
    
    result = await attendance_collection.delete_one({"_id": ObjectId(attendance_id)})
    if result.deleted_count == 1:
        return {"message": "Attendance deleted successfully"}
    
    raise HTTPException(status_code=404, detail="Attendance not found")