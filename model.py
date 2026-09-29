"""Model definition and loading.

Architecture: MobileNetV3-Small with a new classifier head sized to labels.json
(small and fast enough for CPU inference behind the API).
"""
import json
import os
from pathlib import Path

import torch
from torch import nn
from torchvision import models

BASE = Path(__file__).parent
LABELS_PATH = BASE / "labels.json"
WEIGHTS_PATH = Path(os.getenv("AGRICARE_WEIGHTS", BASE / "weights" / "crop_model.pt"))

IMAGE_SIZE = 224
MEAN = [0.485, 0.456, 0.406]   # ImageNet stats, used by the pretrained backbone
STD = [0.229, 0.224, 0.225]


class ModelNotAvailable(ImportError):
    """Raised when weights are missing. Subclasses ImportError so the API
    (services/analysis.py) falls back to its rule-based logic."""


def load_labels() -> list[str]:
    data = json.loads(LABELS_PATH.read_text(encoding="utf-8"))
    return [data[str(i)] for i in range(len(data))]


def build_model(num_classes: int, pretrained: bool = False) -> nn.Module:
    weights = models.MobileNet_V3_Small_Weights.DEFAULT if pretrained else None
    model = models.mobilenet_v3_small(weights=weights)
    model.classifier[3] = nn.Linear(model.classifier[3].in_features, num_classes)
    return model


def load_model():
    """Returns (model in eval mode, labels). Raises ModelNotAvailable if no weights."""
    if not WEIGHTS_PATH.exists():
        raise ModelNotAvailable(f"Weights not found at {WEIGHTS_PATH}. See ai_model/README.md.")

    labels = load_labels()
    model = build_model(len(labels))
    model.load_state_dict(torch.load(WEIGHTS_PATH, map_location="cpu"))
    model.eval()
    return model, labels
