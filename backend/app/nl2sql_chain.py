import json
from textwrap import dedent
from typing import Any, Dict

from langchain_core.prompts import ChatPromptTemplate
from sqlalchemy import MetaData, inspect, text
from sqlalchemy.engine import Engine

from app.db.session import engine as default_engine
from app.llm_client import get_chat_model


def _build_schema_text(engine: Engine) -> str:
    inspector = inspect(engine)
    lines: list[str] = []
    for table_name in inspector.get_table_names():
        lines.append(f"表 {table_name}：")
        cols = inspector.get_columns(table_name)
        for col in cols:
            col_type = str(col.get("type"))
            lines.append(f"- {col['name']} ({col_type})")
        lines.append("")
    return "\n".join(lines).strip()


prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            dedent(
                """
                你是一个负责将自然语言问题转换为 SQLite SQL 查询的助手。
                只允许生成只读的 SELECT 语句，不允许 INSERT/UPDATE/DELETE/DDL 等任何写操作。

                已知数据库结构如下（请严格依据这些表和字段生成 SQL）：
                {schema}

                请用 **JSON 格式** 且只返回一个对象（不要多余文字），结构为：
                {{
                  "sql": "这里是生成的 SQL",
                  "analysis": "这里是你对如何从问题映射到 SQL 的中文简要说明"
                }}
                """
            ),
        ),
        ("human", "{question}"),
    ]
)


def generate_sql(question: str, engine: Engine | None = None) -> Dict[str, Any]:
    """Use Qwen3 to generate SQL and analysis from a natural-language question."""
    eng = engine or default_engine
    schema_text = _build_schema_text(eng)

    llm = get_chat_model("qwen3-max")
    chain = prompt | llm
    resp = chain.invoke({"schema": schema_text, "question": question})

    try:
        parsed = json.loads(resp.content)
    except Exception as exc:  # noqa: BLE001
        raise RuntimeError(f"解析 NL→SQL JSON 失败: {exc}; raw={resp.content!r}") from exc

    sql = parsed.get("sql")
    if not isinstance(sql, str):
        raise RuntimeError(f"NL→SQL 输出中缺少 sql 字段: {parsed}")

    # 简单防御：拒绝包含危险关键字，后续仍由 sql_executor 再做严格检查
    dangerous = ["INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "TRUNCATE"]
    upper_sql = sql.upper()
    if any(word in upper_sql for word in dangerous):
        raise RuntimeError(f"生成的 SQL 包含危险关键字，已拒绝: {sql}")

    return {
        "sql": sql,
        "analysis": parsed.get("analysis", ""),
    }


def execute_sql(sql: str, engine: Engine | None = None, limit: int = 200) -> list[dict[str, Any]]:
    """Execute a SELECT SQL with basic safety and return list-of-dict rows."""
    eng = engine or default_engine

    upper_sql = sql.upper()
    if not upper_sql.strip().startswith("SELECT"):
        raise RuntimeError("只允许执行 SELECT 语句。")

    for word in ["INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "TRUNCATE"]:
        if word in upper_sql:
            raise RuntimeError(f"SQL 中包含禁止关键字: {word}")

    # 若无 LIMIT，则自动追加
    if "LIMIT" not in upper_sql:
        sql = sql.rstrip(" ;") + f" LIMIT {limit}"

    with eng.connect() as conn:
        result = conn.execute(text(sql))
        cols = result.keys()
        rows = [dict(zip(cols, row)) for row in result.fetchall()]
    return rows

