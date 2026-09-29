"""Crop analysis service.

Uses Member 3's model when available. Expected interface:

    backend/ai_model/prediction.py
        predict(image_bytes: bytes) -> {"label": str, "confidence": float}   # confidence 0..1

If the model isn't installed yet, falls back to the context-only rules from
the frontend prototype (no image reading) and reports model_used=False.
"""
from datetime import datetime, timezone

GENERIC_SUGGESTIONS = [
    "Continue regular crop scouting.",
    "Monitor changes in leaves, stems and fruit.",
    "Seek expert confirmation before applying any treatment.",
]


def _model_predict(image_bytes: bytes) -> dict | None:
    try:
        from backend.ai_model.prediction import predict
    except ImportError:
        return None
    return predict(image_bytes)


def _rule_based(farm: dict, weather: dict):
    temp, humidity = weather.get("temperature"), weather.get("humidity")
    ph = farm.get("soil_ph")

    if temp is not None and temp >= 35 and farm.get("irrigation") == "Rainfed":
        return ("Possible Water Stress", 76,
                "High temperature with rain-dependent irrigation can be consistent with water stress.",
                ["Check soil moisture around the root zone.",
                 "Review irrigation needs for the crop stage."])
    if humidity is not None and humidity >= 80:
        return ("Possible Environmental / Disease Stress", 68,
                "High humidity favours some crop diseases; a specific disease cannot be identified from context alone.",
                ["Inspect leaves and stems for spreading spots.",
                 "Seek expert confirmation before applying treatment."])
    if ph is not None and (ph < 5.5 or ph > 8):
        return ("Possible Nutrient Availability Stress", 64,
                "Soil pH outside the common range can affect nutrient availability; a soil test is needed.",
                ["Consider a soil test.",
                 "Don't apply fertilizer based only on this assessment."])
    return ("No Clear Stress Pattern Detected", 71,
            "Field and weather context doesn't indicate a major stress pattern.",
            GENERIC_SUGGESTIONS)


def analyze(image_bytes: bytes, farm: dict, weather: dict) -> dict:
    prediction = _model_predict(image_bytes)

    if prediction:
        assessment = prediction["label"]
        confidence = round(float(prediction["confidence"]) * 100)
        reason = "Prediction from the AgriCare vision model, shown alongside your field context."
        suggestions = GENERIC_SUGGESTIONS
        model_used = True
    else:
        assessment, confidence, reason, suggestions = _rule_based(farm, weather)
        model_used = False

    return {
        "date": datetime.now(timezone.utc).isoformat(),
        "crop": farm.get("crop"),
        "assessment": assessment,
        "confidence": confidence,
        "reason": reason,
        "suggestions": suggestions,
        "expert": confidence < 70 or assessment.startswith("Possible"),
        "model_used": model_used,
        "weather": weather or None,
        "disclaimer": "Informational only; not a confirmed diagnosis. Follow product labels and expert advice.",
    }
