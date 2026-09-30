from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from backend.database import repository
from backend.database.connection import get_db
from backend.database.models import Farmer

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    phone: str = Field(pattern=r"^\d{10}$")


def current_farmer(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> Farmer:
    """Dependency: resolves 'Authorization: Bearer <token>' to a Farmer."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Missing bearer token.")
    farmer = repository.farmer_for_token(db, authorization[7:])
    if not farmer:
        raise HTTPException(401, "Invalid or expired token.")
    return farmer


@router.post("/login")
def login(body: LoginRequest, db: Session = Depends(get_db)):
 farmer = repository.get_or_create_farmer(
    db,
    body.name.strip(),
    body.phone.strip()
)
 return {"token": repository.create_token(db, farmer), "user": farmer.to_dict()}
