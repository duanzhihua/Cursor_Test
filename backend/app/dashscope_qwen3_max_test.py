import os

from dotenv import load_dotenv
from openai import OpenAI


def main() -> None:
    load_dotenv()

    client = OpenAI(
        api_key=os.getenv("DASHSCOPE_API_KEY"),
        base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
    )

    completion = client.chat.completions.create(
        model="qwen3-max",
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "简单用一句中文自我介绍，然后结束。"},
        ],
    )

    json_str = completion.model_dump_json(indent=2)
    try:
        print(json_str)
    except UnicodeEncodeError:
        safe = json_str.encode("gbk", errors="replace").decode("gbk", errors="replace")
        print(safe)


if __name__ == "__main__":
    main()

