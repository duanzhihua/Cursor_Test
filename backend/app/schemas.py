from datetime import datetime
from typing import Any, List, Optional

from pydantic import BaseModel, Field


class SessionCreateRequest(BaseModel):
    name: Optional[str] = Field(
        default=None,
        description="会话名称；为空时由后端基于首轮问题自动生成",
    )


class SessionSummary(BaseModel):
    id: int
    name: str
    updated_at: datetime


class SessionCreateResponse(BaseModel):
    session_id: int


class ChatQueryRequest(BaseModel):
    session_id: Optional[int] = Field(
        default=None,
        description="会话 ID；为空时由后端自动新建会话",
    )
    user_query: str
    chart_preferences: Optional[dict[str, Any]] = None


class ChartSpec(BaseModel):
    type: str
    x_field: Optional[str] = None
    y_field: Optional[str] = None
    series_field: Optional[str] = None
    title: Optional[str] = None
    extra: dict[str, Any] = Field(default_factory=dict)


class ChatQueryResponse(BaseModel):
    session_id: int
    answer_text: str
    sql: str
    data: List[dict[str, Any]]
    chart_spec: ChartSpec
    nl2sql_analysis: str

