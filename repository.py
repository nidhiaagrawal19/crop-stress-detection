"""All reads/writes the API needs. Routes call these; they never touch models directly."""
import secrets

from sqlalchemy import select
from sqlalchemy.orm import Session

from .models import AuthToken, Farm, Farmer, Prediction


def get_or_create_farmer(db: Session, name: str, phone: str) -> Farmer:
    farmer = db.scalar(select(Farmer).where(Farmer.phone == phone))
    if farmer:
        farmer.name = name
    else:
        farmer = Farmer(name=name, phone=phone)
        db.add(farmer)
    db.commit()
    return farmer


def create_token(db: Session, farmer: Farmer) -> str:
    token = secrets.token_urlsafe(24)
    db.add(AuthToken(token=token, farmer_id=farmer.id))
    db.commit()
    return token


def farmer_for_token(db: Session, token: str) -> Farmer | None:
    row = db.get(AuthToken, token)
    return db.get(Farmer, row.farmer_id) if row else None


def save_farm(db: Session, farmer: Farmer, data: dict) -> Farm:
    farm = farmer.farm or Farm()
    for key, value in data.items():
        setattr(farm, key, value)
    farmer.farm = farm
    db.commit()
    return farm


def add_prediction(db: Session, farmer: Farmer, result: dict) -> Prediction:
    prediction = Prediction(
        farmer_id=farmer.id,
        crop=result.get("crop"),
        assessment=result["assessment"],
        confidence=result["confidence"],
        reason=result["reason"],
        suggestions=result.get("suggestions", []),
        expert=result.get("expert", False),
        model_used=result.get("model_used", False),
        weather=result.get("weather"),
    )
    db.add(prediction)
    db.commit()
    return prediction


def list_history(db: Session, farmer: Farmer, limit: int = 20) -> list[dict]:
    rows = db.scalars(
        select(Prediction).where(Prediction.farmer_id == farmer.id)
        .order_by(Prediction.created_at.desc(), Prediction.id.desc()).limit(limit)
    )
    return [p.to_dict() for p in rows]
