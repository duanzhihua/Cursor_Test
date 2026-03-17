from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.schemas import SessionCreateRequest, SessionCreateResponse, SessionSummary
from app.services.session_service import SessionService


router = APIRouter(prefix="/api/session", tags=["session"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/create", response_model=SessionCreateResponse)
def create_session(payload: SessionCreateRequest, db: Session = Depends(get_db)):
    svc = SessionService(db)
    session = svc.create_session(name=payload.name or "新建会话")
    return SessionCreateResponse(session_id=session.id)


@router.get("/list", response_model=list[SessionSummary])
def list_sessions(db: Session = Depends(get_db)):
    svc = SessionService(db)
    sessions = svc.list_sessions()
    return [
        SessionSummary(id=s.id, name=s.name, updated_at=s.updated_at) for s in sessions
    ]

