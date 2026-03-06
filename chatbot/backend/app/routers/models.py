from fastapi import APIRouter

from app.models.schemas import ModelInfo
from app.services.llm_service import get_available_models

router = APIRouter()


@router.get("/api/models", response_model=list[ModelInfo])
async def list_models():
    return get_available_models()
