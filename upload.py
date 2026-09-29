from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from backend.database import repository
from backend.database.connection import get_db
from backend.database.models import Farmer

from ..services import analysis
from .auth import current_farmer

router = APIRouter(tags=["analysis"])

ALLOWED_TYPES = {"image/jpeg", "image/png"}
MAX_BYTES = 5 * 1024 * 1024  # 5 MB


@router.post("/predict")
async def predict_crop(
    image: UploadFile = File(...),
    temperature: float | None = Form(default=None),
    humidity: float | None = Form(default=None),
    farmer: Farmer = Depends(current_farmer),
    db: Session = Depends(get_db),
):
    if image.content_type not in ALLOWED_TYPES:
        raise HTTPException(415, "Only JPG and PNG images are supported.")

    image_bytes = await image.read(MAX_BYTES + 1)
    if len(image_bytes) > MAX_BYTES:
        raise HTTPException(413, "Image is larger than 5 MB.")
    if not image_bytes:
        raise HTTPException(400, "Empty image.")

    if not farmer.farm:
        raise HTTPException(400, "Save farm details before running an analysis.")

    weather = {k: v for k, v in {"temperature": temperature, "humidity": humidity}.items() if v is not None}

    try:
        result = analysis.analyze(image_bytes, farmer.farm.to_dict(), weather)
    except ValueError as exc:                      # e.g. model couldn't decode the image
        raise HTTPException(400, str(exc))

    repository.add_prediction(db, farmer, result)
    return result
