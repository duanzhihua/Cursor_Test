from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database.db import get_db
from app.database.models import ChatMessage, ChatSession, utc_now
from app.models.schemas import (
    SessionCreateRequest,
    SessionDetail,
    SessionInfo,
    SessionUpdateRequest,
    StoredMessage,
)

router = APIRouter()


@router.get("/api/sessions", response_model=list[SessionInfo])
async def list_sessions(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ChatSession).order_by(ChatSession.updated_at.desc(), ChatSession.created_at.desc())
    )
    sessions = result.scalars().all()
    return [SessionInfo.model_validate(session) for session in sessions]


@router.post("/api/sessions", response_model=SessionInfo, status_code=status.HTTP_201_CREATED)
async def create_session(
    payload: SessionCreateRequest,
    db: AsyncSession = Depends(get_db),
):
    title = payload.title.strip() or "新对话"
    session = ChatSession(
        id=str(uuid4()),
        title=title,
        default_model=payload.default_model or settings.default_model,
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return SessionInfo.model_validate(session)


@router.get("/api/sessions/{session_id}", response_model=SessionDetail)
async def get_session(session_id: str, db: AsyncSession = Depends(get_db)):
    session = await db.get(ChatSession, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at.asc())
    )
    messages = result.scalars().all()

    return SessionDetail(
        **SessionInfo.model_validate(session).model_dump(),
        messages=[StoredMessage.model_validate(message) for message in messages],
    )


@router.put("/api/sessions/{session_id}", response_model=SessionInfo)
async def update_session(
    session_id: str,
    payload: SessionUpdateRequest,
    db: AsyncSession = Depends(get_db),
):
    session = await db.get(ChatSession, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session.title = payload.title.strip()
    session.updated_at = utc_now()
    await db.commit()
    await db.refresh(session)
    return SessionInfo.model_validate(session)


@router.delete("/api/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_session(session_id: str, db: AsyncSession = Depends(get_db)):
    session = await db.get(ChatSession, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    await db.delete(session)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
