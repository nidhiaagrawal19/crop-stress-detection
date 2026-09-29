"""Database models. `to_dict()` output matches the shapes the API/frontend already use."""
from datetime import datetime, timezone

from sqlalchemy import JSON, Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .connection import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)


class Farmer(Base):
    __tablename__ = "farmers"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(80))
    phone: Mapped[str] = mapped_column(String(10), unique=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    farm: Mapped["Farm | None"] = relationship(back_populates="farmer", uselist=False, cascade="all, delete-orphan")
    predictions: Mapped[list["Prediction"]] = relationship(
        back_populates="farmer", cascade="all, delete-orphan", order_by="Prediction.created_at.desc()"
    )

    def to_dict(self) -> dict:
        return {"name": self.name, "phone": self.phone}


class Farm(Base):
    """One farm record per farmer (matches the current API)."""
    __tablename__ = "farms"

    id: Mapped[int] = mapped_column(primary_key=True)
    farmer_id: Mapped[int] = mapped_column(ForeignKey("farmers.id", ondelete="CASCADE"), unique=True)

    soil_ph: Mapped[float] = mapped_column(Float)
    soil_colour: Mapped[str] = mapped_column(String(40))
    irrigation: Mapped[str] = mapped_column(String(40))
    water_source: Mapped[str] = mapped_column(String(40))
    crop: Mapped[str] = mapped_column(String(40))
    yield_area: Mapped[float] = mapped_column(Float)
    total_area: Mapped[float] = mapped_column(Float)

    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    state: Mapped[str | None] = mapped_column(String(80), nullable=True)
    region: Mapped[str | None] = mapped_column(String(80), nullable=True)

    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now)
    farmer: Mapped[Farmer] = relationship(back_populates="farm")

    def to_dict(self) -> dict:
        return {
            "soil_ph": self.soil_ph, "soil_colour": self.soil_colour,
            "irrigation": self.irrigation, "water_source": self.water_source,
            "crop": self.crop, "yield_area": self.yield_area, "total_area": self.total_area,
        }


class Prediction(Base):
    __tablename__ = "predictions"

    id: Mapped[int] = mapped_column(primary_key=True)
    farmer_id: Mapped[int] = mapped_column(ForeignKey("farmers.id", ondelete="CASCADE"), index=True)

    crop: Mapped[str | None] = mapped_column(String(40), nullable=True)
    assessment: Mapped[str] = mapped_column(String(120))
    confidence: Mapped[int] = mapped_column(Integer)          # percent, 0..100
    reason: Mapped[str] = mapped_column(Text)
    suggestions: Mapped[list] = mapped_column(JSON, default=list)
    expert: Mapped[bool] = mapped_column(Boolean, default=False)
    model_used: Mapped[bool] = mapped_column(Boolean, default=False)
    weather: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, index=True)

    farmer: Mapped[Farmer] = relationship(back_populates="predictions")

    def to_dict(self) -> dict:
        """Same keys as services/analysis.analyze(), so /history responses don't change."""
        return {
            "date": self.created_at.isoformat(), "crop": self.crop,
            "assessment": self.assessment, "confidence": self.confidence,
            "reason": self.reason, "suggestions": self.suggestions,
            "expert": self.expert, "model_used": self.model_used, "weather": self.weather,
        }


class AuthToken(Base):
    """Bearer tokens issued by /auth/login (no expiry yet; add one before production)."""
    __tablename__ = "auth_tokens"

    token: Mapped[str] = mapped_column(String(64), primary_key=True)
    farmer_id: Mapped[int] = mapped_column(ForeignKey("farmers.id", ondelete="CASCADE"), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
