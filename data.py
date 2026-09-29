import inspect

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field, model_validator
from sqlalchemy.orm import Session

from backend.database import repository
from backend.database.connection import get_db
from backend.database.models import Farmer

from .auth import current_farmer

router = APIRouter(tags=["data"])


class FarmDetails(BaseModel):
    soil_ph: float = Field(ge=0, le=14)
    soil_colour: str
    irrigation: str
    water_source: str
    crop: str
    yield_area: float = Field(ge=0)
    total_area: float = Field(ge=0)

    @model_validator(mode="after")
    def check_areas(self):
        if self.yield_area > self.total_area:
            raise ValueError("yield_area cannot exceed total_area")
        return self


@router.put("/farm")
def save_farm(body: FarmDetails, farmer: Farmer = Depends(current_farmer), db: Session = Depends(get_db)):
    return repository.save_farm(db, farmer, body.model_dump()).to_dict()


@router.get("/farm")
def get_farm(farmer: Farmer = Depends(current_farmer)):
    if not farmer.farm:
        raise HTTPException(404, "No farm details saved yet.")
    return farmer.farm.to_dict()


@router.get("/history")
def get_history(farmer: Farmer = Depends(current_farmer), db: Session = Depends(get_db)):
    return repository.list_history(db, farmer)


@router.get("/weather")
async def weather(lat: float = Query(ge=-90, le=90), lon: float = Query(ge=-180, le=180)):
    """Delegates to backend/database/weather_api.py (Member 4)."""
    try:
        from backend.database.http_utils import ExternalAPIError
        from backend.database.weather_api import get_weather
    except ImportError:
        raise HTTPException(501, "Weather service not available.")
    try:
        result = get_weather(lat, lon)
        return await result if inspect.isawaitable(result) else result
    except ExternalAPIError as exc:
        raise HTTPException(502, str(exc))


@router.get("/location")
async def location(lat: float = Query(ge=-90, le=90), lon: float = Query(ge=-180, le=180)):
    """GPS -> state/region via backend/database/maps_api.py (Member 4)."""
    try:
        from backend.database.http_utils import ExternalAPIError
        from backend.database.maps_api import reverse_geocode
    except ImportError:
        raise HTTPException(501, "Location service not available.")
    try:
        return await reverse_geocode(lat, lon)
    except ExternalAPIError as exc:
        raise HTTPException(502, str(exc))
