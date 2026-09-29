"""Inference entry point used by the API.

    from backend.ai_model.prediction import predict
    predict(image_bytes) -> {"label": str, "confidence": float (0..1), "top3": [...]}
"""
import io

import torch
from PIL import Image, UnidentifiedImageError
from torchvision import transforms

from .model import IMAGE_SIZE, MEAN, STD, load_model

_MODEL, _LABELS = load_model()   # loaded once at import; raises ModelNotAvailable if no weights

_TRANSFORM = transforms.Compose([
    transforms.Resize(int(IMAGE_SIZE * 1.14)),
    transforms.CenterCrop(IMAGE_SIZE),
    transforms.ToTensor(),
    transforms.Normalize(MEAN, STD),
])


def preprocess(image_bytes: bytes) -> torch.Tensor:
    try:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except (UnidentifiedImageError, OSError) as exc:
        raise ValueError("Unreadable image.") from exc
    return _TRANSFORM(image).unsqueeze(0)


@torch.inference_mode()
def predict(image_bytes: bytes) -> dict:
    probs = torch.softmax(_MODEL(preprocess(image_bytes)), dim=1)[0]
    confidence, index = probs.max(dim=0)
    top = torch.topk(probs, k=min(3, len(_LABELS)))

    return {
        "label": _LABELS[index.item()],
        "confidence": float(confidence),
        "top3": [
            {"label": _LABELS[i], "confidence": float(p)}
            for p, i in zip(top.values.tolist(), top.indices.tolist())
        ],
    }
