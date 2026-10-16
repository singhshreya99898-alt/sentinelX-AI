
from datetime import datetime
from pathlib import Path

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import (
    create_engine,
    Column,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import declarative_base, sessionmaker, Session


# --------------------------------------------------
# DATABASE CONFIGURATION
# --------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent.parent
DATABASE_URL = f"sqlite:///{BASE_DIR / 'sentinelx.db'}"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

Base = declarative_base()


# --------------------------------------------------
# DATABASE MODEL
# --------------------------------------------------

class Activity(Base):
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    user = Column(String, nullable=False)
    activity_type = Column(String, nullable=False)
    details = Column(Text, nullable=False)
    risk_level = Column(String, default="Low", nullable=False)
    time = Column(String, nullable=False)


Base.metadata.create_all(bind=engine)


# --------------------------------------------------
# REQUEST SCHEMA
# --------------------------------------------------

class ActivityCreate(BaseModel):
    user: str
    activity_type: str
    details: str


# --------------------------------------------------
# FASTAPI APPLICATION
# --------------------------------------------------

app = FastAPI(
    title="SentinelX AI",
    description="Activity Monitoring and Risk Analysis API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------
# DATABASE SESSION
# --------------------------------------------------

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# --------------------------------------------------
# BASIC ROUTES
# --------------------------------------------------

@app.get("/")
def home():
    return {
        "message": "SentinelX AI Backend is running"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "SentinelX AI Backend",
    }


# --------------------------------------------------
# RISK ANALYSIS
# --------------------------------------------------

def analyze_risk(activity_type: str, details: str):
    text = f"{activity_type} {details}".lower()

    high_keywords = [
        "unauthorized",
        "data breach",
        "malware",
        "multiple failed login",
        "suspicious access",
        "privilege escalation",
    ]

    medium_keywords = [
        "failed login",
        "password change",
        "unusual login",
        "unknown device",
        "access denied",
    ]

    if any(word in text for word in high_keywords):
        return "High"

    if any(word in text for word in medium_keywords):
        return "Medium"

    return "Low"


# --------------------------------------------------
# GET ALL ACTIVITIES
# --------------------------------------------------

@app.get("/activities")
def get_activities(db: Session = Depends(get_db)):
    try:
        activities = (
            db.query(Activity)
            .order_by(Activity.id.desc())
            .all()
        )

        return [
            {
                "id": item.id,
                "user": item.user,
                "activity_type": item.activity_type,
                "details": item.details,
                "risk_level": item.risk_level,
                "time": item.time,
            }
            for item in activities
        ]

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail="Unable to fetch activities",
        ) from exc


# --------------------------------------------------
# ADD NEW ACTIVITY
# --------------------------------------------------

@app.post("/activities", status_code=201)
def add_activity(
    activity: ActivityCreate,
    db: Session = Depends(get_db),
):
    if not activity.user.strip():
        raise HTTPException(
            status_code=422,
            detail="User cannot be empty",
        )

    if not activity.activity_type.strip():
        raise HTTPException(
            status_code=422,
            detail="Activity type cannot be empty",
        )

    if not activity.details.strip():
        raise HTTPException(
            status_code=422,
            detail="Details cannot be empty",
        )

    risk_level = analyze_risk(
        activity.activity_type,
        activity.details,
    )

    new_activity = Activity(
        user=activity.user.strip(),
        activity_type=activity.activity_type.strip(),
        details=activity.details.strip(),
        risk_level=risk_level,
        time=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    )

    try:
        db.add(new_activity)
        db.commit()
        db.refresh(new_activity)

        return {
            "id": new_activity.id,
            "user": new_activity.user,
            "activity_type": new_activity.activity_type,
            "details": new_activity.details,
            "risk_level": new_activity.risk_level,
            "time": new_activity.time,
        }

    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Unable to save activity",
        ) from exc


# --------------------------------------------------
# DELETE ACTIVITY
# --------------------------------------------------

@app.delete("/activities/{activity_id}")
def delete_activity(
    activity_id: int,
    db: Session = Depends(get_db),
):
    activity = (
        db.query(Activity)
        .filter(Activity.id == activity_id)
        .first()
    )

    if activity is None:
        raise HTTPException(
            status_code=404,
            detail="Activity not found",
        )

    try:
        db.delete(activity)
        db.commit()

        return {
            "message": "Activity deleted successfully"
        }

    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Unable to delete activity",
        ) from exc
