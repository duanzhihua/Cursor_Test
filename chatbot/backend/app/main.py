from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database.db import init_db
from app.routers import chat, health, models, session


@asynccontextmanager
async def lifespan(_: FastAPI):
    await init_db()
    yield


app = FastAPI(title="ChatBot API", version="0.5.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(chat.router)
app.include_router(models.router)
app.include_router(session.router)
