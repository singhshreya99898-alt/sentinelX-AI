from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.orm import declarative_base, sessionmaker

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


class ActivityDB(Base):
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    user = Column(String, nullable=False)
    activity_type = Column(String, nullable=False)
    details = Column(String, nullable=False)
    time = Column(String, nullable=False)
    risk_level = Column(String, nullable=True)


Base.metadata.create_all(bind=engine)