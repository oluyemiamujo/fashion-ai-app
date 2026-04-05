"""
Generates eval/ground_truth.csv from the dataset folder structure.

Folder layout:
    eval/dataset/<attribute>/<label>/<image_file>

LABEL_ALIASES maps raw folder names -> canonical model-output labels
so that GT labels align with what the classifier actually returns.
"""
import os
import csv
from collections import defaultdict

DATASET_ROOT = "eval/dataset"
OUTPUT_CSV = "eval/ground_truth.csv"

ATTRIBUTES = [
    "garment_type",
    "style",
    "material",
    "pattern",
    "season",
    "occasion",
]

# Map raw folder names -> canonical labels that match classifier output.
# Add new entries here whenever the dataset folder naming diverges from the
# vocabulary the model uses.
LABEL_ALIASES = {
    # season
    "summer_outfits": "spring/summer",
    "winter_fashion": "autumn/winter",
    # material
    "heavyweight_denim": "heavyweight denim",
    "silk_charmeuse":   "silk charmeuse",
    # garment_type
    "wide_leg_trousers": "wide-leg trousers",
    "wrap_dress":        "wrap dress",
    # style (folder names already match model output)
    "minimalist": "minimalist",
    "streetwear":  "streetwear",
    # pattern
    "jacquard": "jacquard",
    "tie_dye":  "tie-dye",
    # occasion
    "activewear": "activewear",
    "beachwear":  "beachwear",
}


def canonical(label: str) -> str:
    """Return the canonical version of a folder-name label."""
    return LABEL_ALIASES.get(label, label)


def collect_labels():
    image_labels = defaultdict(dict)

    for attr in ATTRIBUTES:
        attr_path = os.path.join(DATASET_ROOT, attr)
        if not os.path.exists(attr_path):
            continue

        for label in os.listdir(attr_path):
            label_path = os.path.join(attr_path, label)
            if not os.path.isdir(label_path):
                continue

            canonical_label = canonical(label)

            for img in os.listdir(label_path):
                if img.lower().endswith((".jpg", ".jpeg", ".png")):
                    image_labels[img][attr] = canonical_label

    return image_labels


def generate_csv():
    image_labels = collect_labels()

    with open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as f:
        fieldnames = ["image"] + ATTRIBUTES
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()

        for image, labels in sorted(image_labels.items()):
            row = {"image": image}
            for attr in ATTRIBUTES:
                row[attr] = labels.get(attr, "")
            writer.writerow(row)

    print(f"CSV generated: {OUTPUT_CSV}")
    print(f"Total images: {len(image_labels)}")
    for attr in ATTRIBUTES:
        vals = {v[attr] for v in image_labels.values() if attr in v}
        print(f"  {attr}: {sorted(vals)}")


if __name__ == "__main__":
    generate_csv()