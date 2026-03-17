import os
from typing import Iterable

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.tools import tool
from langchain_qwq import ChatQwen


MODEL_NAME = "Qwen3.5-Plus"


def _build_llm(stream: bool = False) -> ChatQwen:
    """Create a Qwen3-max ChatModel instance（仅用于本地测试）。"""
    api_key = "sk-10d34fdb9a3e4328b16fd9dc371baf6f"

    return ChatQwen(
        model=MODEL_NAME,
        api_key=api_key,
        stream=stream,
    )


def test_basic_stream() -> None:
  """测试：基础对话 + 流式输出字段结构。"""
  llm = _build_llm(stream=True)

  messages = [
    SystemMessage(
      content="你是一个擅长数据分析和 SQL 生成的助手，回答使用简体中文。",
    ),
    HumanMessage(
      content="请简要用 2 句话介绍一下你自己，然后停下。",
    ),
  ]

  print("=== [basic stream] qwen3-max streaming chunks ===")
  for idx, chunk in enumerate(llm.stream(messages), start=1):
    # chunk 是 ChatGenerationChunk，.content 为当前增量内容
    print(f"\n[chunk {idx}] type={type(chunk)}")
    print("raw chunk:", repr(chunk))
    print("delta content:", repr(chunk.content))


@tool
def mock_get_sales_summary(days: int) -> str:
  """一个用于测试函数调用的 mock 工具，返回最近 N 天销售额的概要。"""
  return f"这是最近 {days} 天的销售额概要（mock 数据，仅用于测试函数调用）。"


def test_tool_calling() -> None:
  """测试：函数调用 / tool calling 的返回字段结构。"""
  llm = _build_llm(stream=False).bind_tools([mock_get_sales_summary])

  messages = [
    SystemMessage(
      content=(
        "你是一个数据分析助手，可以通过 tools 获取业务数据。\n"
        "如果用户询问最近 N 天销售情况，请调用 mock_get_sales_summary 工具。"
      )
    ),
    HumanMessage(
      content="帮我看一下最近 7 天的销售情况，大概说一说就行。",
    ),
  ]

  print("\n=== [tool calling] qwen3-max tool call result ===")
  result = llm.invoke(messages)
  print("raw result:", repr(result))

  # LangChain 会把函数调用信息放在 .tool_calls 字段中
  tool_calls = getattr(result, "tool_calls", None)
  print("\nparsed tool_calls:", repr(tool_calls))

  if tool_calls:
    for i, call in enumerate(tool_calls, start=1):
      print(f"\n[tool_call {i}]")
      print("name:", call.get("name"))
      print("args:", call.get("args"))


def test_tool_calling_stream() -> None:
  """测试：函数调用 + 流式输出时的增量字段。"""
  llm = _build_llm(stream=True).bind_tools([mock_get_sales_summary])

  messages = [
    SystemMessage(
      content=(
        "你是一个数据分析助手，可以通过 tools 获取业务数据。\n"
        "如果用户询问最近 N 天销售情况，请调用 mock_get_sales_summary 工具。"
      )
    ),
    HumanMessage(
      content="再帮我看一下最近 3 天的销售情况。",
    ),
  ]

  print("\n=== [tool calling + stream] incremental chunks ===")
  chunks: Iterable[object] = llm.stream(messages)
  for idx, chunk in enumerate(chunks, start=1):
    print(f"\n[chunk {idx}] type={type(chunk)}")
    print("raw chunk:", repr(chunk))
    # 对于带函数调用的流式返回，通常会有 delta.tool_calls / additional_kwargs 等字段
    delta = getattr(chunk, "additional_kwargs", None)
    print("additional_kwargs:", repr(delta))


if __name__ == "__main__":
  # 你可以在命令行中单独运行某个测试函数，例如：
  #   python -m app.qwen3_max_test
  #
  # 然后观察终端输出的字段结构，了解：
  # - 流式输出 chunk 的形态
  # - 函数调用时 tool_calls / additional_kwargs 的真实返回结构
  test_basic_stream()
  test_tool_calling()
  test_tool_calling_stream()

