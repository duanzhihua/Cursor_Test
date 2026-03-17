import os

from dotenv import load_dotenv
from openai import OpenAI


def main() -> None:
    # 加载 backend/.env 中的 DASHSCOPE_API_KEY
    load_dotenv()

    client = OpenAI(
        # 若没有配置环境变量，请用百炼 API Key 将下行替换为：api_key="sk-xxx"
        api_key=os.getenv("DASHSCOPE_API_KEY"),
        base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
    )

    completion = client.chat.completions.create(
        # 模型列表参考官方文档；这里先用 qwen-plus 做连通性测试
        model="qwen-plus",
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "你是谁？"},
        ],
    )

    # 用 JSON 字符串的方式输出，先转成 Python 字符串再 encode，避免 Windows 控制台编码问题
    json_str = completion.model_dump_json(indent=2)
    # 避免 Windows 控制台编码问题：只打印前 1 行 content，且替换无法编码字符
    try:
        print(json_str)
    except UnicodeEncodeError:
        safe = json_str.encode("gbk", errors="replace").decode("gbk", errors="replace")
        print(safe)


if __name__ == "__main__":
    main()


