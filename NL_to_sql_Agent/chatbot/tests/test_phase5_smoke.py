import json
import urllib.error
import urllib.request


BASE_URL = "http://localhost:8000"


def request_json(path: str, method: str = "GET", data: dict | None = None):
    body = None if data is None else json.dumps(data).encode("utf-8")
    request = urllib.request.Request(BASE_URL + path, data=body, method=method)
    if body is not None:
        request.add_header("Content-Type", "application/json")

    with urllib.request.urlopen(request, timeout=120) as response:
        raw = response.read().decode("utf-8")
        return None if not raw else json.loads(raw)


def stream_chat(session_id: str, message: str, model: str = "deepseek-chat") -> dict:
    request = urllib.request.Request(
        BASE_URL + "/api/chat",
        data=json.dumps(
            {
                "session_id": session_id,
                "message": message,
                "model": model,
            }
        ).encode("utf-8"),
        method="POST",
    )
    request.add_header("Content-Type", "application/json")

    tokens: list[str] = []
    errors: list[str] = []
    done_model = None

    with urllib.request.urlopen(request, timeout=120) as response:
        for raw in response:
            line = raw.decode("utf-8").strip()
            if not line.startswith("data: "):
                continue

            event = json.loads(line[6:])
            if event.get("type") == "content" and event.get("token"):
                tokens.append(event["token"])
            elif event.get("type") == "error":
                errors.append(event.get("message", "unknown error"))
            elif event.get("type") == "done":
                done_model = event.get("model")
                break

    return {
        "preview": "".join(tokens)[:120],
        "error": errors[0] if errors else None,
        "done_model": done_model,
    }


def main():
    result: dict = {}

    health = request_json("/api/health")
    result["health"] = health["status"]

    created = request_json(
        "/api/sessions",
        method="POST",
        data={"title": "新对话", "default_model": "deepseek-chat"},
    )
    session_id = created["id"]
    result["created_session"] = {"id": session_id, "title": created["title"]}

    detail_before = request_json(f"/api/sessions/{session_id}")
    result["messages_before_chat"] = len(detail_before["messages"])

    renamed = request_json(
        f"/api/sessions/{session_id}",
        method="PUT",
        data={"title": "Phase5测试会话"},
    )
    result["renamed_title"] = renamed["title"]

    chat_result = stream_chat(session_id=session_id, message="请只回复：测试成功")
    result["chat"] = chat_result

    detail_after = request_json(f"/api/sessions/{session_id}")
    result["messages_after_chat"] = len(detail_after["messages"])
    result["roles_after_chat"] = [message["role"] for message in detail_after["messages"]]
    result["assistant_models"] = [
        message.get("model")
        for message in detail_after["messages"]
        if message["role"] == "assistant"
    ]

    sessions = request_json("/api/sessions")
    result["session_list_contains_id"] = any(
        session["id"] == session_id for session in sessions
    )

    request_json(f"/api/sessions/{session_id}", method="DELETE")
    try:
        request_json(f"/api/sessions/{session_id}")
        result["deleted_check"] = "still exists"
    except urllib.error.HTTPError as exc:
        result["deleted_check"] = exc.code

    print(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    main()
