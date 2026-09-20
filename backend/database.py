from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.orm import declarative_base, sessionmaker


# =========================
# Database Configuration
# =========================

DATABASE_URL = "sqlite:///./sentinelx.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


# =========================
# Activity Model
# =========================

class ActivityDB(Base):
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    user = Column(String, nullable=False)
    activity_type = Column(String, nullable=False)
    details = Column(String, nullable=False)
    time = Column(String, nullable=False)
    risk_level = Column(String, nullable=True)


# =========================
# Session Security Model
# =========================

class SessionDB(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)

    # Authorized user/account identifier
    user = Column(String, nullable=False)

    # Unique session identifier
    session_id = Column(String, unique=True, nullable=False, index=True)

    # Device identifier supplied by the application
    device_id = Column(String, nullable=False)

    # Session start and last activity time
    started_at = Column(String, nullable=False)
    last_seen = Column(String, nullable=False)

    # active / ended
    status = Column(String, nullable=False, default="active")


# =========================
# Create Database Tables
# =========================

Base.metadata.create_all(bind=engine)