from typing import List, Optional

from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.models import ChatMessage, ChatSession


class SessionService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create_session(self, name: Optional[str] = None) -> ChatSession:
        session = ChatSession(name=name or "新建会话")
        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)
        return session

    def list_sessions(self, limit: int = 50) -> List[ChatSession]:
        stmt = select(ChatSession).order_by(desc(ChatSession.updated_at)).limit(limit)
        return list(self.db.scalars(stmt))

    def append_message(
        self,
        session_id: int,
        role: str,
        content: str,
        sql: str | None = None,
        chart_spec: str | None = None,
    ) -> ChatMessage:
        msg = ChatMessage(
            session_id=session_id,
            role=role,
            content=content,
            sql=sql,
            chart_spec=chart_spec,
        )
        self.db.add(msg)

        # touch session updated_at
        session = self.db.get(ChatSession, session_id)
        if session is not None:
            self.db.add(session)

        self.db.commit()
        self.db.refresh(msg)
        return msg

    def get_recent_messages(self, session_id: int, limit: int = 10) -> List[ChatMessage]:
        stmt = (
            select(ChatMessage)
            .where(ChatMessage.session_id == session_id)
            .order_by(desc(ChatMessage.created_at))
            .limit(limit)
        )
        rows = list(self.db.scalars(stmt))
        return list(reversed(rows))

