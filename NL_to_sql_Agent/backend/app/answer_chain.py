import json
from textwrap import dedent
from typing import Any, Dict, List

from langchain_core.prompts import ChatPromptTemplate

from app.llm_client import get_chat_model


prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            dedent(
                """
                你是一个数据分析专家，需要基于 SQL 查询结果，用中文给出解释，并推荐合适的图表配置。

                请严格返回一个 JSON 对象（不要任何多余文字），结构为：
                {{
                  "answer_text": "用中文对查询结果做解释和总结，面向业务用户",
                  "chart_spec": {{
                    "type": "bar" | "line" | "table",
                    "x_field": "用作横轴的字段名（如有）",
                    "y_field": "用作纵轴的字段名（如有）",
                    "series_field": "用作分组/系列的字段名（如有）",
                    "title": "图表标题",
                    "extra": {{}}
                  }}
                }}
                """
            ),
        ),
        (
            "human",
            dedent(
                """
                用户问题：
                {question}

                已执行 SQL：
                {sql}

                查询结果示例（仅前若干行）：
                {rows_json}
                """
            ),
        ),
    ]
)


def build_answer_and_chart(
    question: str,
    sql: str,
    rows: List[Dict[str, Any]],
) -> Dict[str, Any]:
    llm = get_chat_model("qwen3-max")
    chain = prompt | llm

    rows_json = json.dumps(rows[:20], ensure_ascii=False, indent=2)
    resp = chain.invoke({"question": question, "sql": sql, "rows_json": rows_json})

    try:
        parsed = json.loads(resp.content)
    except Exception as exc:  # noqa: BLE001
        raise RuntimeError(f"解析 answer_chain JSON 失败: {exc}; raw={resp.content!r}") from exc

    answer_text = parsed.get("answer_text")
    chart_spec = parsed.get("chart_spec") or {}
    if not isinstance(answer_text, str):
        raise RuntimeError(f"answer_chain 输出中缺少 answer_text 字段: {parsed}")

    return {
        "answer_text": answer_text,
        "chart_spec": chart_spec,
    }

