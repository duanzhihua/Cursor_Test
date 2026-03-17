from datetime import datetime

from sqlalchemy import Column, Date, DateTime, Integer, String, Text
from sqlalchemy.orm import declarative_base


Base = declarative_base()


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(Integer, nullable=False, index=True)
    role = Column(String(32), nullable=False)  # user / assistant / system
    content = Column(Text, nullable=False)
    sql = Column(Text, nullable=True)
    chart_spec = Column(Text, nullable=True)  # JSON string
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class Sales(Base):
    """业务表：销售明细，用于 NL→SQL 测试。"""

    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, autoincrement=True)
    order_date = Column(Date, nullable=False)  # 订单日期
    region = Column(String(50), nullable=False)  # 区域，如 东部/西部/南部/北部
    product = Column(String(100), nullable=False)  # 产品名称
    channel = Column(String(50), nullable=False)  # 渠道，如 线上/线下
    amount = Column(Integer, nullable=False)  # 销售金额

