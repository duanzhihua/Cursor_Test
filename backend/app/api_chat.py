import json

from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from app.answer_chain import build_answer_and_chart
from app.db.session import SessionLocal
from app.nl2sql_chain import execute_sql, generate_sql
from app.schemas import ChatQueryRequest, ChatQueryResponse, ChartSpec
from app.services.session_service import SessionService


router = APIRouter(prefix="/api/chat", tags=["chat"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.options("/query")
def chat_query_options() -> Response:
    # 让浏览器的 CORS 预检请求直接返回 200，由 CORS 中间件补全响应头
    return Response(status_code=200)


@router.post("/query", response_model=ChatQueryResponse)
def chat_query(payload: ChatQueryRequest, db: Session = Depends(get_db)):
    svc = SessionService(db)

    # 1. 确定会话
    if payload.session_id is None:
        session = svc.create_session()
    else:
        from app.models import ChatSession  # 局部导入以避免循环

        session = db.get(ChatSession, payload.session_id)
        if session is None:
            session = svc.create_session()

    session_id = session.id

    # 2. 记录用户消息
    svc.append_message(session_id=session_id, role="user", content=payload.user_query)

    # 3. NL→SQL
    nl2sql_result = generate_sql(payload.user_query)
    sql = nl2sql_result["sql"]
    nl2sql_analysis = nl2sql_result.get("analysis", "")

    # 4. 执行 SQL
    rows = execute_sql(sql)

    # 5. 结果解释 + 图表建议
    answer_and_chart = build_answer_and_chart(payload.user_query, sql, rows)

    answer_text = answer_and_chart["answer_text"]
    chart_spec_dict = answer_and_chart["chart_spec"] or {}

    # 6. 记录助手消息
    svc.append_message(
        session_id=session_id,
        role="assistant",
        content=answer_text,
        sql=sql,
        chart_spec=json.dumps(chart_spec_dict, ensure_ascii=False),
    )

    # 7. 组装响应
    return ChatQueryResponse(
        session_id=session_id,
        answer_text=answer_text,
        sql=sql,
        data=rows,
        chart_spec=ChartSpec(**chart_spec_dict),
        nl2sql_analysis=nl2sql_analysis,
    )

