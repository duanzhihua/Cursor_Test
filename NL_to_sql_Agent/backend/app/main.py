from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api_chat import router as chat_router
from app.api_session import router as session_router
from app.core.config import settings
from app.db.session import init_db


def create_app() -> FastAPI:
    app = FastAPI(
        title="NL to SQL Backend",
        version="0.1.0",
    )

    # CORS（Phase 1：允许任何源访问，且不携带凭证）
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ALLOW_ORIGINS,
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # 初始化数据库
    init_db()

    @app.get("/health")
    async def health_check():
        return {"status": "ok"}

    app.include_router(session_router)
    app.include_router(chat_router)

    return app


app = create_app()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )

