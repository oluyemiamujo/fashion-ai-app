import os
import sys
import numpy as np
import pandas as pd

from openai import OpenAI
from dotenv import load_dotenv
import logging



PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.append(PROJECT_ROOT)

load_dotenv(override=True)
RESULTS_FILE = os.path.join(PROJECT_ROOT, "eval", "results.csv")


ATTRIBUTES = [
    "garment_type",
    "style",
    "material",
    "pattern",
    "season",
    "occasion"
]


SIMILARITY_THRESHOLD = 0.80


client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def cosine_similarity(a, b):

    a = np.array(a)
    b = np.array(b)

    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))


def get_embedding(text):

    text = text.lower().strip()

    response = client.embeddings.create(
        model="text-embedding-3-small",
        input=text
    )

    return response.data[0].embedding


def evaluate_semantic():

    df = pd.read_csv(RESULTS_FILE)

    accuracy_results = []

    print("\nRunning semantic evaluation...\n")

    for attr in ATTRIBUTES:

        correct = 0
        total = 0

        for _, row in df.iterrows():

            gt = str(row[f"gt_{attr}"])
            pred = str(row[f"pred_{attr}"])

            gt_emb = get_embedding(gt)
            pred_emb = get_embedding(pred)

            similarity = cosine_similarity(gt_emb, pred_emb)

            if similarity >= SIMILARITY_THRESHOLD:
                correct += 1

            total += 1

        accuracy = correct / total

        accuracy_results.append({
            "attribute": attr,
            "semantic_accuracy": accuracy
        })

    result_df = pd.DataFrame(accuracy_results)

    print("\nSemantic Evaluation Results\n")
    print(result_df)

    return result_df


if __name__ == "__main__":
    evaluate_semantic()