from fastapi import APIRouter, HTTPException
from bson import ObjectId
from typing import List
from database import (
    student_collection, course_collection,
    student_helper, course_helper
)
from models import Student, Course, StudentResponse, CourseResponse

router = APIRouter(prefix="/admin", tags=["admin"])

# Student CRUD operations
@router.post("/students/", response_model=StudentResponse)
async def create_student(student: Student):
    student_dict = student.dict()
    result = await student_collection.insert_one(student_dict)
    new_student = await student_collection.find_one({"_id": result.inserted_id})
    return student_helper(new_student)

@router.get("/students/", response_model=List[StudentResponse])
async def get_all_students():
    students = []
    async for student in student_collection.find():
        students.append(student_helper(student))
    return students

@router.get("/students/{student_id}", response_model=StudentResponse)
async def get_student(student_id: str):
    if not ObjectId.is_valid(student_id):
        raise HTTPException(status_code=400, detail="Invalid student ID")
    
    student = await student_collection.find_one({"_id": ObjectId(student_id)})
    if student:
        return student_helper(student)
    raise HTTPException(status_code=404, detail="Student not found")

@router.put("/students/{student_id}", response_model=StudentResponse)
async def update_student(student_id: str, student: Student):
    if not ObjectId.is_valid(student_id):
        raise HTTPException(status_code=400, detail="Invalid student ID")
    
    student_dict = student.dict()
    result = await student_collection.update_one(
        {"_id": ObjectId(student_id)}, {"$set": student_dict}
    )
    
    if result.modified_count == 1:
        updated_student = await student_collection.find_one({"_id": ObjectId(student_id)})
        return student_helper(updated_student)
    
    raise HTTPException(status_code=404, detail="Student not found")

@router.delete("/students/{student_id}")
async def delete_student(student_id: str):
    if not ObjectId.is_valid(student_id):
        raise HTTPException(status_code=400, detail="Invalid student ID")
    
    result = await student_collection.delete_one({"_id": ObjectId(student_id)})
    if result.deleted_count == 1:
        return {"message": "Student deleted successfully"}
    
    raise HTTPException(status_code=404, detail="Student not found")

# Course CRUD operations
@router.post("/courses/", response_model=CourseResponse)
async def create_course(course: Course):
    course_dict = course.dict()
    result = await course_collection.insert_one(course_dict)
    new_course = await course_collection.find_one({"_id": result.inserted_id})
    return course_helper(new_course)

@router.get("/courses/", response_model=List[CourseResponse])
async def get_all_courses():
    courses = []
    async for course in course_collection.find():
        courses.append(course_helper(course))
    return courses

@router.get("/courses/{course_id}", response_model=CourseResponse)
async def get_course(course_id: str):
    if not ObjectId.is_valid(course_id):
        raise HTTPException(status_code=400, detail="Invalid course ID")
    
    course = await course_collection.find_one({"_id": ObjectId(course_id)})
    if course:
        return course_helper(course)
    raise HTTPException(status_code=404, detail="Course not found")

@router.put("/courses/{course_id}", response_model=CourseResponse)
async def update_course(course_id: str, course: Course):
    if not ObjectId.is_valid(course_id):
        raise HTTPException(status_code=400, detail="Invalid course ID")
    
    course_dict = course.dict()
    result = await course_collection.update_one(
        {"_id": ObjectId(course_id)}, {"$set": course_dict}
    )
    
    if result.modified_count == 1:
        updated_course = await course_collection.find_one({"_id": ObjectId(course_id)})
        return course_helper(updated_course)
    
    raise HTTPException(status_code=404, detail="Course not found")

@router.delete("/courses/{course_id}")
async def delete_course(course_id: str):
    if not ObjectId.is_valid(course_id):
        raise HTTPException(status_code=400, detail="Invalid course ID")
    
    result = await course_collection.delete_one({"_id": ObjectId(course_id)})
    if result.deleted_count == 1:
        return {"message": "Course deleted successfully"}
    
    raise HTTPException(status_code=404, detail="Course not found")