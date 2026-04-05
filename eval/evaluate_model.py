"""
evaluate_model.py
-----------------
Full evaluation pipeline for the fashion AI classifier.

Key design decisions
--------------------
* normalize_label() is applied to BOTH the ground-truth AND prediction before
  comparison, so folder-name aliases and model free-text variants all collapse
  to a shared canonical form.
* garment_type uses substring matching: if the canonical GT token appears
  anywhere inside the (normalised) prediction string, it counts as correct.
  This handles model responses like "blazer and wide-leg trousers" -> correct
  for GT "wide-leg trousers".
* "(inferred)" suffixes are stripped before comparison.
* Diagnostics are printed at the start of every run.
"""
import matplotlib
matplotlib.use("Agg")

import os
import re
import sys
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import confusion_matrix

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.append(PROJECT_ROOT)

from app.backend.services.ai_classifier import classify_image


DATASET_DIR       = os.path.join(PROJECT_ROOT, "eval", "dataset")
GROUND_TRUTH_FILE = os.path.join(PROJECT_ROOT, "eval", "ground_truth.csv")
RESULTS_FILE      = os.path.join(PROJECT_ROOT, "eval", "results.csv")
PLOTS_DIR         = os.path.join(PROJECT_ROOT, "eval", "plots")

os.makedirs(PLOTS_DIR, exist_ok=True)

ATTRIBUTES = [
    "garment_type",
    "style",
    "material",
    "pattern",
    "season",
    "occasion",
]

# ---------------------------------------------------------------------------
# Normalisation table
# ---------------------------------------------------------------------------
# Keys must be lowercase.  Values are the canonical form that both GT and
# predictions are mapped to before comparison.
# ---------------------------------------------------------------------------
_NORM_TABLE = {
    # garment_type
    "wide-leg trousers":  "wide-leg trousers",
    "wide leg trousers":  "wide-leg trousers",
    "wide_leg_trousers":  "wide-leg trousers",
    "wrap dress":         "wrap dress",
    "wrap_dress":         "wrap dress",
    "dress":              "wrap dress",

    # style
    "minimalist":         "minimalist",
    "minimal":            "minimalist",
    "streetwear":         "streetwear",
    "street":             "streetwear",
    "street wear":        "streetwear",

    # material
    "heavyweight denim":  "heavyweight denim",
    "heavyweight_denim":  "heavyweight denim",
    "denim":              "heavyweight denim",
    "silk charmeuse":     "silk charmeuse",
    "silk_charmeuse":     "silk charmeuse",
    "silk":               "silk charmeuse",
    "satin":              "silk charmeuse",

    # pattern
    "tie-dye":            "tie-dye",
    "tie dye":            "tie-dye",
    "tie_dye":            "tie-dye",
    "jacquard":           "jacquard",

    # season
    "spring/summer":      "spring/summer",
    "spring_summer":      "spring/summer",
    "spring":             "spring/summer",
    "summer":             "spring/summer",
    "summer_outfits":     "spring/summer",
    "autumn/winter":      "autumn/winter",
    "autumn_winter":      "autumn/winter",
    "fall":               "autumn/winter",
    "winter":             "autumn/winter",
    "winter_fashion":     "autumn/winter",

    # occasion
    "activewear":         "activewear",
    "active":             "activewear",
    "sports":             "activewear",
    "athletic":           "activewear",
    "beachwear":          "beachwear",
    "beach":              "beachwear",
    "swimwear":           "beachwear",
}

# garment_type uses substring matching (model returns full outfit descriptions)
_SUBSTRING_MATCH_ATTRS = {"garment_type"}


def normalize_label(attr: str, value: str) -> str:
    """
    Normalise a label value for comparison.
    Steps:
      1. Strip whitespace
      2. Remove trailing " (inferred)" markers
      3. Lowercase
      4. Look up in _NORM_TABLE; return mapped value or cleaned original
    """
    value = value.strip()
    value = re.sub(r"\s*\(inferred\)", "", value, flags=re.IGNORECASE).strip()
    value = value.lower()
    return _NORM_TABLE.get(value, value)


def build_image_index(dataset_dir: str) -> dict:
    """Traverse dataset dir and map filename -> full path."""
    image_map = {}
    for root, _, files in os.walk(dataset_dir):
        for file in files:
            if file.lower().endswith((".jpg", ".jpeg", ".png")):
                image_map[file] = os.path.join(root, file)
    return image_map


# ---------------------------------------------------------------------------
# Inference
# ---------------------------------------------------------------------------

def run_inference() -> pd.DataFrame:
    gt = pd.read_csv(GROUND_TRUTH_FILE)
    image_index = build_image_index(DATASET_DIR)

    # ── Diagnostics ────────────────────────────────────────────────────────
    print("\n" + "=" * 60)
    print("DIAGNOSTIC — Dataset Alignment Check")
    print("=" * 60)
    print(f"  Ground-truth CSV rows : {len(gt)}")
    print(f"  Images in dataset dir : {len(image_index)}")

    csv_names = set(gt["image"].tolist())
    dir_names = set(image_index.keys())
    missing_in_dir = csv_names - dir_names
    extra_in_dir   = dir_names - csv_names
    print(f"  In CSV, missing from dir : {len(missing_in_dir)}")
    for n in sorted(missing_in_dir):
        print(f"    MISSING: {n}")
    print(f"  In dir, not in CSV       : {len(extra_in_dir)}")
    for n in sorted(extra_in_dir):
        print(f"    EXTRA  : {n}")
    print()
    print("  First 10 ground-truth rows:")
    for _, row in gt.head(10).iterrows():
        labelled = {a: row[a] for a in ATTRIBUTES if pd.notna(row[a]) and str(row[a]).strip()}
        print(f"    {row['image']}  ->  {labelled}")
    print("=" * 60 + "\n")
    # ── End diagnostics ────────────────────────────────────────────────────

    results = []
    print("Running model inference...\n")

    for _, row in gt.iterrows():
        image_name = row["image"]
        image_path = image_index.get(image_name)

        if not image_path:
            print(f"  [SKIP] Image not found in dataset dir: {image_name}")
            continue

        print(f"  Processing: {image_name}")
        prediction = classify_image(image_path)

        record = {"image": image_name}
        for attr in ATTRIBUTES:
            record[f"gt_{attr}"]   = row[attr] if pd.notna(row[attr]) else ""
            record[f"pred_{attr}"] = prediction.get(attr, "")

        results.append(record)

    df = pd.DataFrame(results)
    df.to_csv(RESULTS_FILE, index=False)
    print(f"\nResults saved to: {RESULTS_FILE} ({len(df)} rows)\n")
    return df


# ---------------------------------------------------------------------------
# Accuracy computation
# ---------------------------------------------------------------------------

def _is_correct(attr: str, gt_norm: str, pred_norm: str) -> bool:
    """
    Return True if the prediction counts as correct.
    garment_type: substring match (model returns full outfit descriptions).
    All others: exact match after normalisation.
    """
    if attr in _SUBSTRING_MATCH_ATTRS:
        return gt_norm in pred_norm
    return gt_norm == pred_norm


def compute_accuracy(df: pd.DataFrame) -> pd.DataFrame:
    accuracy_data = []

    print("\n" + "=" * 60)
    print("DIAGNOSTIC — Per-attribute sample comparisons")
    print("=" * 60)

    for attr in ATTRIBUTES:
        gt_col   = f"gt_{attr}"
        pred_col = f"pred_{attr}"

        mask = df[gt_col].notna() & (df[gt_col].astype(str).str.strip() != "")
        filtered = df[mask].copy()

        if len(filtered) == 0:
            print(f"\n  [{attr}]  No GT samples found — skipped")
            continue

        filtered["_gt_norm"]   = filtered[gt_col].astype(str).apply(
            lambda v: normalize_label(attr, v)
        )
        filtered["_pred_norm"] = filtered[pred_col].astype(str).apply(
            lambda v: normalize_label(attr, v)
        )
        filtered["_correct"] = filtered.apply(
            lambda r: _is_correct(attr, r["_gt_norm"], r["_pred_norm"]), axis=1
        )

        correct  = filtered["_correct"].sum()
        total    = len(filtered)
        accuracy = correct / total

        accuracy_data.append({
            "attribute": attr,
            "accuracy":  accuracy,
            "correct":   correct,
            "samples":   total,
        })

        print(f"\n  [{attr}]  accuracy = {accuracy:.1%}  ({correct}/{total})")
        for _, r in filtered.head(5).iterrows():
            tick = "OK" if r["_correct"] else "XX"
            print(f"    [{tick}]  gt='{r['_gt_norm']}'  pred='{r['_pred_norm']}'")

    print("\n" + "=" * 60 + "\n")

    acc_df = pd.DataFrame(accuracy_data)
    print("Evaluation Accuracy Table")
    print(acc_df.to_string(index=False))
    return acc_df


# ---------------------------------------------------------------------------
# Plots
# ---------------------------------------------------------------------------

def plot_accuracy_bar(acc_df: pd.DataFrame) -> None:
    fig, ax = plt.subplots(figsize=(9, 5))
    bars = ax.bar(acc_df["attribute"], acc_df["accuracy"], color="#4f8ef7")
    ax.set_title("Model Accuracy by Attribute")
    ax.set_ylabel("Accuracy")
    ax.set_xlabel("Attribute")
    ax.set_ylim(0, 1)
    for bar, (_, row) in zip(bars, acc_df.iterrows()):
        ax.text(
            bar.get_x() + bar.get_width() / 2,
            bar.get_height() + 0.02,
            f"{row['accuracy']:.0%}",
            ha="center", va="bottom", fontsize=10,
        )
    plt.tight_layout()
    path = os.path.join(PLOTS_DIR, "accuracy_bar_chart.png")
    plt.savefig(path)
    print(f"Saved: {path}")


def plot_confusion_matrices(df: pd.DataFrame) -> None:
    for attr in ATTRIBUTES:
        gt_col   = f"gt_{attr}"
        pred_col = f"pred_{attr}"
        mask = df[gt_col].notna() & (df[gt_col].astype(str).str.strip() != "")
        filtered = df[mask].copy()
        if len(filtered) == 0:
            continue

        gt_vals   = filtered[gt_col].astype(str).apply(lambda v: normalize_label(attr, v))
        pred_vals = filtered[pred_col].astype(str).apply(lambda v: normalize_label(attr, v))
        labels = sorted(set(gt_vals) | set(pred_vals))

        cm  = confusion_matrix(gt_vals, pred_vals, labels=labels)
        fig, ax = plt.subplots(figsize=(max(6, len(labels)), max(5, len(labels))))
        sns.heatmap(cm, annot=True, fmt="d", xticklabels=labels, yticklabels=labels, ax=ax)
        ax.set_title(f"Confusion Matrix: {attr}")
        ax.set_xlabel("Predicted")
        ax.set_ylabel("Ground Truth")
        plt.tight_layout()
        path = os.path.join(PLOTS_DIR, f"{attr}_confusion_matrix.png")
        plt.savefig(path)
        print(f"Saved: {path}")
        plt.close()


def update_readme_table(acc_df: pd.DataFrame) -> None:
    readme_path = os.path.join(PROJECT_ROOT, "README.md")
    table  = "\n### Model Evaluation Results\n\n"
    table += "| Attribute | Accuracy | Samples |\n"
    table += "|-----------|----------|---------|\n"
    for _, row in acc_df.iterrows():
        table += f"| {row['attribute']} | {round(row['accuracy'] * 100, 2)}% | {int(row['samples'])} |\n"
    table += "\n"
    if os.path.exists(readme_path):
        with open(readme_path, "a", encoding="utf-8") as f:
            f.write(table)
        print("Evaluation table appended to README.md")


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main():
    df     = run_inference()
    acc_df = compute_accuracy(df)
    plot_accuracy_bar(acc_df)
    plot_confusion_matrices(df)
    update_readme_table(acc_df)


if __name__ == "__main__":
    main()


# ---------------------------------------------------------------------------
# Dead code below preserved for reference — replaced by above implementation
# ---------------------------------------------------------------------------

def _DEAD_build_image_index(dataset_dir):
    """Original (kept for reference)."""
    image_map = {}
    for root, _, files in os.walk(dataset_dir):
        for file in files:
            if file.lower().endswith((".jpg", ".jpeg", ".png")):
                image_map[file] = os.path.join(root, file)
    return image_map

# Original LABEL_NORMALIZATION (never called — replaced by _NORM_TABLE above):
_DEAD_LABEL_NORMALIZATION = {
    "garment_type": {"wrap dress": "wrap_dress", "dress": "wrap_dress",
                     "trousers": "wide_leg_trousers", "pants": "wide_leg_trousers"},
    "style":    {"minimal": "minimalist", "street": "streetwear"},
    "material": {"silk": "silk_charmeuse", "denim": "heavyweight_denim"},
    "pattern":  {"tie dye": "tie_dye", "tie-dye": "tie_dye"},
    "season":   {"summer": "spring_summer", "spring": "spring_summer",
                 "winter": "autumn_winter", "fall": "autumn_winter"},
    "occasion": {"beach": "beachwear", "sports": "activewear", "active": "activewear"},
}

