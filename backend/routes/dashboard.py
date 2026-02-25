from fastapi import APIRouter, HTTPException
from bson import ObjectId
from typing import List, Optional
from database import (
    student_collection, prediction_collection,
    assessment_collection, attendance_collection,
    student_helper
)
from models import RiskStatistics, StudentRiskDetail, ModelMetrics
from ml.model import prediction_model

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/statistics", response_model=RiskStatistics)
async def get_risk_statistics():
    """Get risk level statistics"""
    predictions = await prediction_collection.find().to_list(length=None)
    
    total = len(predictions)
    low_risk = sum(1 for p in predictions if p["risk_status"] == "Low")
    medium_risk = sum(1 for p in predictions if p["risk_status"] == "Medium")
    high_risk = sum(1 for p in predictions if p["risk_status"] == "High")
    
    return RiskStatistics(
        total_students=total,
        low_risk=low_risk,
        medium_risk=medium_risk,
        high_risk=high_risk,
        low_risk_percentage=(low_risk/total*100) if total > 0 else 0,
        medium_risk_percentage=(medium_risk/total*100) if total > 0 else 0,
        high_risk_percentage=(high_risk/total*100) if total > 0 else 0
    )

@router.get("/high-risk", response_model=List[StudentRiskDetail])
async def get_high_risk_students():
    """Get all high-risk students with details"""
    high_risk_students = []
    
    predictions = await prediction_collection.find(
        {"risk_status": "High"}
    ).to_list(length=None)
    
    for prediction in predictions:
        student = await student_collection.find_one(
            {"_id": ObjectId(prediction["student_id"])}
        )
        
        if student:
            # Get latest assessment average
            assessments = []
            async for assessment in assessment_collection.find(
                {"student_id": prediction["student_id"]}
            ):
                assessments.append(assessment)
            
            assessment_avg = 0
            if assessments:
                scores = [a["test_score"] + a["assignment_score"] + a["exam_score"] 
                         for a in assessments]
                assessment_avg = sum(scores) / len(scores) if scores else 0
            
            # Get attendance average
            attendances = []
            async for attendance in attendance_collection.find(
                {"student_id": prediction["student_id"]}
            ):
                attendances.append(attendance)
            
            attendance_avg = 0
            if attendances:
                attendance_avg = sum(a["attendance_percentage"] for a in attendances) / len(attendances)
            
            high_risk_students.append(
                StudentRiskDetail(
                    student_id=prediction["student_id"],
                    student_name=student["name"],
                    matric_no=student["matric_no"],
                    level=student["level"],
                    department=student["department"],
                    predicted_score=prediction["predicted_score"],
                    risk_status=prediction["risk_status"],
                    attendance_percentage=attendance_avg,
                    assessment_average=assessment_avg
                )
            )
    
    return high_risk_students

@router.get("/students", response_model=List[StudentRiskDetail])
async def get_all_students_with_risk(
    search: Optional[str] = None,
    level: Optional[int] = None,
    department: Optional[str] = None
):
    """Get all students with their risk status, with optional filters"""
    result = []
    
    # Build query for students
    student_query = {}
    if search:
        student_query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"matric_no": {"$regex": search, "$options": "i"}}
        ]
    if level:
        student_query["level"] = level
    if department:
        student_query["department"] = {"$regex": department, "$options": "i"}
    
    students = await student_collection.find(student_query).to_list(length=None)
    
    for student in students:
        student_id = str(student["_id"])
        
        # Get latest prediction
        prediction = await prediction_collection.find_one(
            {"student_id": student_id},
            sort=[("created_at", -1)]
        )
        
        if prediction:
            # Get latest assessment average
            assessments = []
            async for assessment in assessment_collection.find({"student_id": student_id}):
                assessments.append(assessment)
            
            assessment_avg = 0
            if assessments:
                scores = [a["test_score"] + a["assignment_score"] + a["exam_score"] 
                         for a in assessments]
                assessment_avg = sum(scores) / len(scores) if scores else 0
            
            # Get attendance average
            attendances = []
            async for attendance in attendance_collection.find({"student_id": student_id}):
                attendances.append(attendance)
            
            attendance_avg = 0
            if attendances:
                attendance_avg = sum(a["attendance_percentage"] for a in attendances) / len(attendances)
            
            result.append(
                StudentRiskDetail(
                    student_id=student_id,
                    student_name=student["name"],
                    matric_no=student["matric_no"],
                    level=student["level"],
                    department=student["department"],
                    predicted_score=prediction["predicted_score"],
                    risk_status=prediction["risk_status"],
                    attendance_percentage=attendance_avg,
                    assessment_average=assessment_avg
                )
            )
    
    return result

@router.get("/model-metrics")
async def get_model_metrics():
    """Get model evaluation metrics"""
    if prediction_model.metrics:
        return prediction_model.metrics
    return {"message": "Model metrics not available. Train the model first."}