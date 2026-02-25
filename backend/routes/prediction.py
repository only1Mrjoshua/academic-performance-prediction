from fastapi import APIRouter, HTTPException
from bson import ObjectId
from typing import List
from database import (
    student_collection, assessment_collection, 
    attendance_collection, prediction_collection,
    prediction_helper
)
from models import Prediction
from ml.model import prediction_model
from datetime import datetime
import os

router = APIRouter(prefix="/prediction", tags=["prediction"])

@router.post("/train")
async def train_model():
    """Train the prediction model"""
    try:
        metrics = prediction_model.train_model()
        return {
            "message": "Model trained successfully",
            "metrics": metrics,
            "config": {
                "samples": int(os.getenv("N_SAMPLES", 1000)),
                "seed": int(os.getenv("RANDOM_SEED", 42)),
                "thresholds": {
                    "high": float(os.getenv("HIGH_RISK_THRESHOLD", 0.65)),
                    "medium": float(os.getenv("MEDIUM_RISK_THRESHOLD", 0.45))
                }
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/thresholds")
async def get_thresholds():
    """Get current risk thresholds"""
    return {
        "high_risk_threshold": float(os.getenv("HIGH_RISK_THRESHOLD", 0.65)),
        "medium_risk_threshold": float(os.getenv("MEDIUM_RISK_THRESHOLD", 0.45))
    }

@router.get("/metrics")
async def get_model_metrics():
    """Get model evaluation metrics"""
    if prediction_model.metrics:
        return prediction_model.metrics
    return {"message": "Model not trained yet"}

@router.post("/generate/{student_id}")
async def generate_prediction(student_id: str):
    """Generate prediction for a specific student"""
    if not ObjectId.is_valid(student_id):
        raise HTTPException(status_code=400, detail="Invalid student ID")
    
    # Get student data
    student = await student_collection.find_one({"_id": ObjectId(student_id)})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Get student's assessments
    assessments = []
    async for assessment in assessment_collection.find({"student_id": student_id}):
        assessments.append(assessment)
    
    # Get student's attendance
    attendances = []
    async for attendance in attendance_collection.find({"student_id": student_id}):
        attendances.append(attendance)
    
    if not assessments or not attendances:
        raise HTTPException(
            status_code=400, 
            detail="Insufficient data for prediction. Need both assessments and attendance records."
        )
    
    # Calculate metrics
    metrics = prediction_model.calculate_student_metrics(student_id, assessments, attendances)
    if not metrics:
        raise HTTPException(status_code=400, detail="Could not calculate student metrics")
    
    # Generate prediction
    prediction_result = prediction_model.predict_risk(
        metrics['attendance'],
        metrics['test_avg'],
        metrics['assignment_avg'],
        metrics['previous_gpa']
    )
    
    # Save prediction
    prediction = Prediction(
        student_id=student_id,
        predicted_score=prediction_result['predicted_score'],
        risk_status=prediction_result['risk_status']
    )
    
    # Delete old predictions for this student
    await prediction_collection.delete_many({"student_id": student_id})
    
    # Insert new prediction
    prediction_dict = prediction.dict()
    prediction_dict['created_at'] = datetime.now()
    result = await prediction_collection.insert_one(prediction_dict)
    
    new_prediction = await prediction_collection.find_one({"_id": result.inserted_id})
    return prediction_helper(new_prediction)

@router.post("/generate-all")
async def generate_all_predictions():
    """Generate predictions for all students with sufficient data"""
    predictions = []
    students = await student_collection.find().to_list(length=None)
    
    print(f"🔍 Generating predictions for {len(students)} students")
    
    for student in students:
        student_id = str(student["_id"])
        student_name = student["name"]
        
        print(f"\n📝 Processing student: {student_name} (ID: {student_id})")
        
        # Get student's assessments and attendance
        assessments = []
        async for assessment in assessment_collection.find({"student_id": student_id}):
            assessments.append(assessment)
        
        attendances = []
        async for attendance in attendance_collection.find({"student_id": student_id}):
            attendances.append(attendance)
        
        print(f"Found {len(assessments)} assessments and {len(attendances)} attendance records")
        
        if assessments and attendances:
            try:
                # Calculate metrics
                metrics = prediction_model.calculate_student_metrics(
                    student_id, assessments, attendances
                )
                
                print(f"Calculated metrics: {metrics}")
                
                if metrics:
                    # Generate prediction
                    prediction_result = prediction_model.predict_risk(
                        metrics['attendance'],
                        metrics['test_avg'],
                        metrics['assignment_avg'],
                        metrics['previous_gpa']
                    )
                    
                    print(f"Prediction result: {prediction_result}")
                    
                    # Save prediction
                    prediction = Prediction(
                        student_id=student_id,
                        predicted_score=prediction_result['predicted_score'],
                        risk_status=prediction_result['risk_status']
                    )
                    
                    # Delete old predictions for this student
                    await prediction_collection.delete_many({"student_id": student_id})
                    
                    # Insert new prediction
                    prediction_dict = prediction.dict()
                    prediction_dict['created_at'] = datetime.now()
                    result = await prediction_collection.insert_one(prediction_dict)
                    
                    new_prediction = await prediction_collection.find_one(
                        {"_id": result.inserted_id}
                    )
                    predictions.append(prediction_helper(new_prediction))
                    
                    print(f"✅ Saved prediction for {student_name}")
                    
            except Exception as e:
                print(f"❌ Error predicting for student {student_id}: {str(e)}")
        else:
            print(f"⚠️ Insufficient data for {student_name}")
    
    print(f"\n✅ Generated predictions for {len(predictions)} students")
    
    return {
        "message": f"Generated predictions for {len(predictions)} students",
        "predictions": predictions
    }

@router.get("/student/{student_id}")
async def get_student_prediction(student_id: str):
    """Get the latest prediction for a student"""
    if not ObjectId.is_valid(student_id):
        raise HTTPException(status_code=400, detail="Invalid student ID")
    
    prediction = await prediction_collection.find_one(
        {"student_id": student_id},
        sort=[("created_at", -1)]
    )
    
    if prediction:
        return prediction_helper(prediction)
    
    raise HTTPException(status_code=404, detail="No prediction found for this student")

@router.get("/all")
async def get_all_predictions():
    """Get all predictions"""
    predictions = []
    async for prediction in prediction_collection.find().sort("created_at", -1):
        predictions.append(prediction_helper(prediction))
    return predictions