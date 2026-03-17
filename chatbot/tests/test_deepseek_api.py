"""
DeepSeek API 流式输出测试脚本
测试三种模式，详细记录每个 chunk 的字段结构，用于前端接口对接。

模式 1: deepseek-reasoner 模型 (流式)
模式 2: deepseek-chat + thinking 参数 (流式)
模式 3: deepseek-chat 普通模式 (流式，无思考)
"""

import json
import time
from openai import OpenAI

API_KEY = "sk-24883541bc654093911f0d5525bd7d9f"
BASE_URL = "https://api.deepseek.com"

client = OpenAI(api_key=API_KEY, base_url=BASE_URL)

DIVIDER = "=" * 80


def dump_chunk(chunk, index: int):
    """将 chunk 对象的所有字段以 JSON 格式打印"""
    raw = chunk.model_dump()
    print(f"\n--- Chunk #{index} ---")
    print(json.dumps(raw, ensure_ascii=False, indent=2))
    return raw


def test_mode(mode_name: str, model: str, messages: list, extra_body: dict | None = None, max_chunks: int = 15):
    """
    通用测试函数：发起流式请求，打印前 max_chunks 个完整 chunk，
    然后静默收集剩余内容，最后输出汇总。
    """
    print(f"\n{DIVIDER}")
    print(f" 测试模式: {mode_name}")
    print(f" model={model}, extra_body={extra_body}")
    print(DIVIDER)

    kwargs = dict(model=model, messages=messages, stream=True)
    if extra_body:
        kwargs["extra_body"] = extra_body

    print(f"\n[请求参数] {json.dumps(kwargs, ensure_ascii=False, default=str)}")
    print(f"\n[开始接收流式响应...]\n")

    start = time.time()

    response = client.chat.completions.create(**kwargs)

    reasoning_content = ""
    content = ""
    chunk_count = 0
    first_chunk_raw = None
    last_chunk_raw = None
    has_reasoning_field = False
    reasoning_chunks = 0
    content_chunks = 0
    finish_reason = None

    for chunk in response:
        chunk_count += 1
        raw = chunk.model_dump()

        if chunk_count == 1:
            first_chunk_raw = raw

        if chunk_count <= max_chunks:
            dump_chunk(chunk, chunk_count)

        delta = chunk.choices[0].delta if chunk.choices else None
        if delta:
            rc = getattr(delta, "reasoning_content", None)
            if rc:
                has_reasoning_field = True
                reasoning_content += rc
                reasoning_chunks += 1

            c = getattr(delta, "content", None) or ""
            if c:
                content += c
                content_chunks += 1

        fr = chunk.choices[0].finish_reason if chunk.choices else None
        if fr:
            finish_reason = fr

        last_chunk_raw = raw

    elapsed = time.time() - start

    print(f"\n{'─' * 60}")
    print(f"[汇总] 模式: {mode_name}")
    print(f"  总 chunk 数:         {chunk_count}")
    print(f"  reasoning chunk 数:  {reasoning_chunks}")
    print(f"  content chunk 数:    {content_chunks}")
    print(f"  has_reasoning_field: {has_reasoning_field}")
    print(f"  finish_reason:       {finish_reason}")
    print(f"  耗时:                {elapsed:.2f}s")
    print(f"\n[第一个 chunk 完整结构]")
    print(json.dumps(first_chunk_raw, ensure_ascii=False, indent=2))
    print(f"\n[最后一个 chunk 完整结构]")
    print(json.dumps(last_chunk_raw, ensure_ascii=False, indent=2))

    if reasoning_content:
        preview = reasoning_content[:500]
        print(f"\n[reasoning_content 前500字]")
        print(preview)
        if len(reasoning_content) > 500:
            print(f"  ... (总计 {len(reasoning_content)} 字)")

    if content:
        preview = content[:500]
        print(f"\n[content 前500字]")
        print(preview)
        if len(content) > 500:
            print(f"  ... (总计 {len(content)} 字)")

    print(f"\n{DIVIDER}\n")

    return {
        "mode": mode_name,
        "chunk_count": chunk_count,
        "reasoning_chunks": reasoning_chunks,
        "content_chunks": content_chunks,
        "has_reasoning_field": has_reasoning_field,
        "finish_reason": finish_reason,
        "first_chunk": first_chunk_raw,
        "last_chunk": last_chunk_raw,
        "reasoning_content_len": len(reasoning_content),
        "content_len": len(content),
        "elapsed": elapsed,
    }


if __name__ == "__main__":
    question = "9.11 and 9.8, which is greater?"
    messages = [{"role": "user", "content": question}]

    results = []

    # ── 测试 1: deepseek-reasoner ──
    print("\n\n" + "█" * 80)
    print("  测试 1/3: deepseek-reasoner 模型")
    print("█" * 80)
    r1 = test_mode(
        mode_name="deepseek-reasoner",
        model="deepseek-reasoner",
        messages=messages,
    )
    results.append(r1)

    # ── 测试 2: deepseek-chat + thinking enabled ──
    print("\n\n" + "█" * 80)
    print("  测试 2/3: deepseek-chat + thinking enabled")
    print("█" * 80)
    r2 = test_mode(
        mode_name="deepseek-chat+thinking",
        model="deepseek-chat",
        messages=messages,
        extra_body={"thinking": {"type": "enabled"}},
    )
    results.append(r2)

    # ── 测试 3: deepseek-chat 普通模式 ──
    print("\n\n" + "█" * 80)
    print("  测试 3/3: deepseek-chat 普通模式（无思考）")
    print("█" * 80)
    r3 = test_mode(
        mode_name="deepseek-chat(normal)",
        model="deepseek-chat",
        messages=messages,
    )
    results.append(r3)

    # ── 最终对比 ──
    print("\n\n" + "█" * 80)
    print("  三种模式对比汇总")
    print("█" * 80)
    print(f"\n{'模式':<30} {'chunks':>8} {'reasoning':>10} {'content':>10} {'has_reasoning':>15} {'finish':>10} {'耗时':>8}")
    print("─" * 100)
    for r in results:
        print(f"{r['mode']:<30} {r['chunk_count']:>8} {r['reasoning_chunks']:>10} {r['content_chunks']:>10} {str(r['has_reasoning_field']):>15} {str(r['finish_reason']):>10} {r['elapsed']:>7.1f}s")

    print("\n\n[字段差异分析]")
    for r in results:
        fc = r["first_chunk"]
        delta_keys = list(fc["choices"][0]["delta"].keys()) if fc and fc.get("choices") else []
        print(f"\n  {r['mode']}:")
        print(f"    delta 字段: {delta_keys}")
        print(f"    reasoning_content 长度: {r['reasoning_content_len']} 字")
        print(f"    content 长度: {r['content_len']} 字")

    print("\n\n测试完成。\n")
