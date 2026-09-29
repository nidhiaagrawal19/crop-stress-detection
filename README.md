# ai_model

## Files
- `model.py`: architecture (MobileNetV3-Small), weight and label loading
- `prediction.py`: `predict(image_bytes)`, the function the API calls
- `train.py`: fine-tuning script (writes weights and `labels.json`)
- `labels.json`: class index to label. **The current list is a placeholder.**
  `train.py` overwrites it. Labels are shown to farmers, so keep them readable.

## Output contract (used by `backend/api/services/analysis.py`)
```python
predict(image_bytes) -> {"label": "Leaf Blight", "confidence": 0.91, "top3": [...]}
```
`confidence` is 0..1. Unreadable images raise `ValueError`.

## Weights
Place the file at `backend/ai_model/weights/crop_model.pt`, or set `AGRICARE_WEIGHTS=/path/to/file.pt`.
`*.pt` is git-ignored. Share weights via a download link (Drive/Releases) and paste it here:

    WEIGHTS LINK: <add link>

Without weights, importing `prediction.py` raises `ModelNotAvailable` (an `ImportError`),
and the API falls back to its rule-based logic (`model_used: false`).

## Training
    python -m backend.ai_model.train --data data --epochs 5

Suggested data: PlantVillage (clean, lab-style photos) plus PlantDoc or your own
field photos. PlantVillage-only models tend to do much worse on real field images.

## Caveats
- Softmax confidence is not calibrated. Don't present it as a probability of being right.
- Evaluate on held-out field photos before showing results to farmers.
