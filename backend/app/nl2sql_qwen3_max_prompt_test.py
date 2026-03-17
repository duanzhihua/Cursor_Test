import json
import os
from textwrap import dedent

from dotenv import load_dotenv
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from sqlalchemy import Column, Integer, MetaData, String, Table, create_engine, text


def build_test_db():
    """构建一个内存 SQLite 测试库，包含简单 sales 表，用于 NL→SQL 演示。"""
    engine = create_engine("sqlite:///:memory:", echo=False, future=True)
    metadata = MetaData()

    sales = Table(
        "sales",
        metadata,
        Column("id", Integer, primary_key=True),
        Column("order_date", String, nullable=False),
        Column("region", String, nullable=False),
        Column("product", String, nullable=False),
        Column("amount", Integer, nullable=False),
    )

    metadata.create_all(engine)

    with engine.begin() as conn:
        conn.execute(
            sales.insert(),
            [
                {
                    "order_date": "2026-03-10",
                    "region": "东部",
                    "product": "A",
                    "amount": 120,
                },
                {
                    "order_date": "2026-03-10",
                    "region": "西部",
                    "product": "B",
                    "amount": 80,
                },
                {
                    "order_date": "2026-03-11",
                    "region": "东部",
                    "product": "A",
                    "amount": 150,
                },
                {
                    "order_date": "2026-03-11",
                    "region": "西部",
                    "product": "B",
                    "amount": 90,
                },
            ],
        )

    return engine, sales


def build_schema_text(table: Table) -> str:
    cols = []
    for col in table.columns:
        cols.append(f"- {col.name} ({col.type})")
    return "表 sales：\n" + "\n".join(cols)


def main() -> None:
    load_dotenv()

    engine, sales = build_test_db()
    schema_text = build_schema_text(sales)

    llm = ChatOpenAI(
        api_key=os.getenv("DASHSCOPE_API_KEY"),
        base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
        model="qwen3-max",
        temperature=0,
    )

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

    chain = prompt | llm

    question = "分别统计东部和西部各自的销售总额。"

    print("=== NL→SQL 请求参数示例 ===")
    print(
        json.dumps(
            {
                "schema": schema_text,
                "question": question,
            },
            ensure_ascii=False,
            indent=2,
        )
    )

    resp = chain.invoke({"schema": schema_text, "question": question})
    print("\n=== LLM 原始返回（text） ===")
    print(repr(resp.content))

    try:
        parsed = json.loads(resp.content)
    except Exception as exc:  # noqa: BLE001
        print("\n!!! 解析 JSON 失败：", exc)
        return

    print("\n=== 解析后的 NL→SQL 输出 ===")
    print(json.dumps(parsed, ensure_ascii=False, indent=2))

    sql = parsed.get("sql")
    if not sql:
        print("\n!!! 未从模型输出中解析到 sql 字段")
        return

    print("\n=== 执行生成的 SQL 并查看结果 ===")
    print("SQL:", sql)
    with engine.connect() as conn:
        rows = conn.execute(text(sql)).fetchall()
        print("rows:", rows)


if __name__ == "__main__":
    main()

