from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime

from .database import SessionLocal, Base, engine, ActivityDB


Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="SentinelX AI",
    version="0.1.0"
)


# -----------------------------
# CORS
# -----------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -----------------------------
# Database
# -----------------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# -----------------------------
# Activity Request Model
# -----------------------------
class Activity(BaseModel):
    user: str
    activity_type: str
    details: str


# -----------------------------
# Risk Analyzer
# -----------------------------
def analyze_risk(activity_type: str, details: str):

    text = (activity_type + " " + details).lower()

    high_risk_words = [
        "hack",
        "malware",
        "phishing",
        "steal",
        "password",
        "failed login",
        "multiple failed login",
        "brute force"
    ]

    medium_risk_words = [
        "suspicious",
        "unknown",
        "bypass",
        "proxy"
    ]

    if any(word in text for word in high_risk_words):
        return (
            "High",
            "Potentially harmful or security-related activity detected."
        )

    elif any(word in text for word in medium_risk_words):
        return (
            "Medium",
            "Activity contains potentially suspicious keywords."
        )

    else:
        return (
            "Low",
            "No suspicious pattern detected."
        )


# -----------------------------
# Home
# -----------------------------
@app.get("/")
def home():
    return {
        "message": "SentinelX AI Backend is running"
    }


# -----------------------------
# Health Check
# -----------------------------
@app.get("/health")
def health():
    return {
        "status": "healthy"
    }


# -----------------------------
# Add Activity
# -----------------------------
@app.post("/activities")
def add_activity(
    activity: Activity,
    db: Session = Depends(get_db)
):

    risk_level, reason = analyze_risk(
        activity.activity_type,
        activity.details
    )

    new_activity = ActivityDB(
        user=activity.user,
        activity_type=activity.activity_type,
        details=activity.details,
        time=datetime.now().isoformat(),
        risk_level=risk_level
    )

    db.add(new_activity)
    db.commit()
    db.refresh(new_activity)

    return {
        "message": "Activity saved successfully",
        "data": {
            "id": new_activity.id,
            "user": new_activity.user,
            "activity_type": new_activity.activity_type,
            "details": new_activity.details,
            "time": new_activity.time,
            "risk_level": new_activity.risk_level,
            "reason": reason
        }
    }


# -----------------------------
# Get All Activities
# -----------------------------
@app.get("/activities")
def get_activities(
    db: Session = Depends(get_db)
):

    activities = db.query(ActivityDB).all()

    return [
        {
            "id": activity.id,
            "user": activity.user,
            "activity_type": activity.activity_type,
            "details": activity.details,
            "time": activity.time,
            "risk_level": activity.risk_level,
            "reason": analyze_risk(
                activity.activity_type,
                activity.details
            )[1]
        }
        for activity in activities
    ]


# -----------------------------
# Risk Analysis
# -----------------------------
@app.get("/risk-analysis")
def risk_analysis(
    activity_type: str,
    details: str
):

    risk_level, reason = analyze_risk(
        activity_type,
        details
    )

    return {
        "activity_type": activity_type,
        "details": details,
        "risk_level": risk_level,
        "reason": reason
    }


# -----------------------------
# Dashboard Summary
# -----------------------------
@app.get("/dashboard-summary")
def dashboard_summary(
    db: Session = Depends(get_db)
):

    activities = db.query(ActivityDB).all()

    total_activities = len(activities)

    low_risk = sum(
        1 for activity in activities
        if activity.risk_level == "Low"
    )

    medium_risk = sum(
        1 for activity in activities
        if activity.risk_level == "Medium"
    )

    high_risk = sum(
        1 for activity in activities
        if activity.risk_level == "High"
    )

    if high_risk > 0:
        overall_risk = "High"
    elif medium_risk > 0:
        overall_risk = "Medium"
    else:
        overall_risk = "Low"

    return {
        "total_activities": total_activities,
        "low_risk": low_risk,
        "medium_risk": medium_risk,
        "high_risk": high_risk,
        "overall_risk": overall_risk
    }