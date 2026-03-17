import json
import traceback
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.db import AsyncSessionLocal, get_db
from app.database.models import ChatMessage, ChatSession, utc_now
from app.models.schemas import ChatRequest
from app.services.llm_service import stream_by_model

router = APIRouter()


def _build_session_title(message: str) -> str:
    compact = " ".join(message.strip().split())
    return compact[:20] or "新对话"


async def _save_assistant_message(
    session_id: str,
    content: str,
    reasoning_content: str | None,
    model: str,
) -> None:
    async with AsyncSessionLocal() as db:
        session = await db.get(ChatSession, session_id)
        if not session:
            return

        db.add(
            ChatMessage(
                id=str(uuid4()),
                session_id=session_id,
                role="assistant",
                content=content,
                reasoning_content=reasoning_content or None,
                model=model,
                created_at=utc_now(),
            )
        )
        session.updated_at = utc_now()
        session.default_model = model
        await db.commit()


@router.post("/api/chat")
async def chat(request: ChatRequest, db: AsyncSession = Depends(get_db)):
    if not request.session_id:
        raise HTTPException(status_code=400, detail="session_id is required")

    chat_session = await db.get(ChatSession, request.session_id)
    if not chat_session:
        raise HTTPException(status_code=404, detail="Session not found")

    history_result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.session_id == request.session_id)
        .order_by(ChatMessage.created_at.asc())
    )
    history_messages = history_result.scalars().all()
    messages = [{"role": msg.role, "content": msg.content} for msg in history_messages]

    user_content = request.message.strip()
    user_message = ChatMessage(
        id=str(uuid4()),
        session_id=request.session_id,
        role="user",
        content=user_content,
        model=request.model,
        created_at=utc_now(),
    )
    db.add(user_message)

    if not history_messages and chat_session.title == "新对话":
        chat_session.title = _build_session_title(user_content)

    chat_session.updated_at = utc_now()
    chat_session.default_model = request.model
    await db.commit()

    messages.append({"role": "user", "content": user_content})

    async def event_generator():
        assistant_content = ""
        reasoning_content = ""
        assistant_saved = False
        final_model = request.model

        try:
            async for event in stream_by_model(
                messages=messages,
                model=request.model,
                system_prompt=request.system_prompt,
                temperature=request.temperature,
            ):
                event_type = event.get("type")
                token = event.get("token")

                if event_type == "reasoning" and token:
                    reasoning_content += token
                elif event_type == "content" and token:
                    assistant_content += token
                elif event_type == "done":
                    final_model = event.get("model", request.model)
                    if assistant_content or reasoning_content:
                        await _save_assistant_message(
                            session_id=request.session_id,
                            content=assistant_content,
                            reasoning_content=reasoning_content,
                            model=final_model,
                        )
                        assistant_saved = True

                yield f"data: {json.dumps(event, ensure_ascii=False)}\n\n"

                if event_type == "done":
                    return

            if not assistant_saved and (assistant_content or reasoning_content):
                await _save_assistant_message(
                    session_id=request.session_id,
                    content=assistant_content,
                    reasoning_content=reasoning_content,
                    model=final_model,
                )
        except Exception as e:
            traceback.print_exc()
            error_text = assistant_content or f"**错误**: {str(e)}"
            if not assistant_saved:
                await _save_assistant_message(
                    session_id=request.session_id,
                    content=error_text,
                    reasoning_content=reasoning_content,
                    model=final_model,
                )
            error_event = {"type": "error", "message": str(e)}
            yield f"data: {json.dumps(error_event, ensure_ascii=False)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
