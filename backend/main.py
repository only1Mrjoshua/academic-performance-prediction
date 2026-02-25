import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn

from routes import admin, lecturer, prediction, dashboard
from ml.model import prediction_model

# Load environment variables from .env file
load_dotenv()

# Configuration from environment variables
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", 8000))
RELOAD = os.getenv("RELOAD", "True").lower() == "true"
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:8080").split(",")

# Security config
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))

app = FastAPI(title="Academic Performance Prediction System")

# CORS middleware with environment variables
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(admin.router)
app.include_router(lecturer.router)
app.include_router(prediction.router)
app.include_router(dashboard.router)

# Mount static files for frontend
frontend_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")
if os.path.exists(frontend_path):
    app.mount("/", StaticFiles(directory=frontend_path, html=True), name="frontend")

@app.on_event("startup")
async def startup_event():
    """Initialize model on startup"""
    print(f"Connecting to MongoDB: {os.getenv('MONGODB_DB')}")
    if not prediction_model.load_model():
        print("Training new model...")
        prediction_model.train_model()
        print("Model trained successfully")

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy", 
        "message": "Academic Performance Prediction System is running",
        "mongodb": os.getenv("MONGODB_DB"),
        "port": PORT
    }

if __name__ == "__main__":
    print(f"Starting server on {HOST}:{PORT}")
    uvicorn.run("main:app", host=HOST, port=PORT, reload=RELOAD)