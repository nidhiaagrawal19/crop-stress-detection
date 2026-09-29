"""Fine-tune the classifier.

Dataset layout (one folder per class):
    data/train/<class_name>/*.jpg
    data/val/<class_name>/*.jpg

Run from the repository root:
    python -m backend.ai_model.train --data data --epochs 5

Writes weights/crop_model.pt (best val accuracy) and labels.json
(from the folder names, so labels always match the weights).
"""
import argparse
import json

import torch
from torch import nn
from torch.utils.data import DataLoader
from torchvision import datasets, transforms

from .model import IMAGE_SIZE, LABELS_PATH, MEAN, STD, WEIGHTS_PATH, build_model


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--data", default="data")
    p.add_argument("--epochs", type=int, default=5)
    p.add_argument("--batch", type=int, default=32)
    p.add_argument("--lr", type=float, default=1e-3)
    args = p.parse_args()

    norm = transforms.Normalize(MEAN, STD)
    train_tf = transforms.Compose([
        transforms.RandomResizedCrop(IMAGE_SIZE, scale=(0.6, 1.0)),
        transforms.RandomHorizontalFlip(),
        transforms.ColorJitter(0.3, 0.3, 0.2),
        transforms.ToTensor(), norm,
    ])
    val_tf = transforms.Compose([
        transforms.Resize(int(IMAGE_SIZE * 1.14)), transforms.CenterCrop(IMAGE_SIZE),
        transforms.ToTensor(), norm,
    ])

    train_ds = datasets.ImageFolder(f"{args.data}/train", train_tf)
    val_ds = datasets.ImageFolder(f"{args.data}/val", val_tf)
    train_dl = DataLoader(train_ds, batch_size=args.batch, shuffle=True, num_workers=2)
    val_dl = DataLoader(val_ds, batch_size=args.batch, num_workers=2)

    device = "cuda" if torch.cuda.is_available() else "cpu"
    model = build_model(len(train_ds.classes), pretrained=True).to(device)
    opt = torch.optim.Adam(model.parameters(), lr=args.lr)
    loss_fn = nn.CrossEntropyLoss()

    best = 0.0
    WEIGHTS_PATH.parent.mkdir(parents=True, exist_ok=True)

    for epoch in range(1, args.epochs + 1):
        model.train()
        for x, y in train_dl:
            x, y = x.to(device), y.to(device)
            opt.zero_grad()
            loss_fn(model(x), y).backward()
            opt.step()

        model.eval()
        correct = 0
        with torch.inference_mode():
            for x, y in val_dl:
                correct += (model(x.to(device)).argmax(1).cpu() == y).sum().item()
        acc = correct / len(val_ds)
        print(f"epoch {epoch}/{args.epochs}  val_acc={acc:.3f}")

        if acc > best:
            best = acc
            torch.save(model.state_dict(), WEIGHTS_PATH)
            labels = {str(i): c.replace("_", " ") for c, i in train_ds.class_to_idx.items()}
            LABELS_PATH.write_text(json.dumps(labels, indent=2, ensure_ascii=False), encoding="utf-8")

    print(f"Saved best model (val_acc={best:.3f}) to {WEIGHTS_PATH}")


if __name__ == "__main__":
    main()
